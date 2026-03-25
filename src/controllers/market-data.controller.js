const { DISCOVER_LIMIT_DEFAULT, FINNHUB_API_KEY, TWELVE_DATA_API_KEY } = require("../config/env");
const { mapWithConcurrency } = require("../utils/async");
const { compactText, splitSymbols } = require("../utils/text");
const {
  dedupeSearchRows,
  discoverCategorySymbols,
  fetchByProvider,
  searchFinnhub,
  searchTwelve,
} = require("../services/market-data.service");

async function quote(req, res) {
  const symbols = splitSymbols(req.query.symbols);
  const provider = String(req.query.provider || "auto").toLowerCase();

  if (!["auto", "finnhub", "twelve", "compare"].includes(provider)) {
    return res.status(400).json({ error: "Provider inválido" });
  }

  if (!symbols.length) {
    return res.status(400).json({ error: "No hay símbolos para consultar" });
  }

  if (provider === "finnhub" && !FINNHUB_API_KEY) {
    return res.status(400).json({ error: "Falta FINNHUB_API_KEY en servidor" });
  }

  if (provider === "twelve" && !TWELVE_DATA_API_KEY) {
    return res.status(400).json({ error: "Falta TWELVE_DATA_API_KEY en servidor" });
  }

  if ((provider === "auto" || provider === "compare") && !FINNHUB_API_KEY && !TWELVE_DATA_API_KEY) {
    return res.status(400).json({ error: "Configura al menos una API key en el servidor" });
  }

  const settled = await mapWithConcurrency(symbols, 8, (symbol) =>
    fetchByProvider(symbol, provider)
  );
  const rows = settled
    .filter((result) => result.status === "fulfilled")
    .flatMap((result) => result.value);

  if (!rows.length) {
    const firstRejected = settled.find((result) => result.status === "rejected");
    return res.status(502).json({
      error:
        firstRejected?.reason?.message ||
        "No se pudo obtener cotizaciones con el proveedor seleccionado",
    });
  }

  return res.status(200).json({ rows });
}

async function search(req, res) {
  const query = compactText(req.query.q);
  const provider = String(req.query.provider || "auto").toLowerCase();

  if (query.length < 2) {
    return res.status(400).json({ error: "Introduce al menos 2 caracteres para buscar" });
  }

  if (!["auto", "finnhub", "twelve", "compare"].includes(provider)) {
    return res.status(400).json({ error: "Provider inválido" });
  }

  if (provider === "finnhub") {
    return res.status(200).json({ rows: dedupeSearchRows(await searchFinnhub(query)) });
  }

  if (provider === "twelve") {
    return res.status(200).json({ rows: dedupeSearchRows(await searchTwelve(query)) });
  }

  const [finnhubRows, twelveRows] = await Promise.all([searchFinnhub(query), searchTwelve(query)]);

  const merged =
    provider === "compare"
      ? [...finnhubRows, ...twelveRows]
      : dedupeSearchRows([...finnhubRows, ...twelveRows]);

  return res.status(200).json({ rows: merged.slice(0, 30) });
}

async function discover(req, res) {
  const category = compactText(req.query.category).toLowerCase();
  const limit = Math.max(1, Math.min(2000, Number(req.query.limit) || DISCOVER_LIMIT_DEFAULT));

  if (!["money", "bonds", "mixed", "equity"].includes(category)) {
    return res.status(400).json({ error: "Categoría inválida" });
  }

  try {
    const symbols = await discoverCategorySymbols(category, limit);
    return res.status(200).json({
      symbols,
      count: symbols.length,
      source: "Finnhub symbol catalog",
    });
  } catch (error) {
    return res.status(502).json({
      error: error.message || "No se pudo descubrir símbolos para la categoría",
    });
  }
}

module.exports = {
  quote,
  search,
  discover,
};
