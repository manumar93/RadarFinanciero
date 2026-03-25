const { TWELVE_DATA_API_KEY } = require("../config/env");
const { compactText, toNum } = require("../utils/text");

async function fetchTwelveSymbol(symbol) {
  if (!TWELVE_DATA_API_KEY) throw new Error("Falta TWELVE_DATA_API_KEY en el servidor");

  const url = `https://api.twelvedata.com/quote?symbol=${encodeURIComponent(symbol)}&apikey=${encodeURIComponent(TWELVE_DATA_API_KEY)}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Twelve Data HTTP ${res.status} (${symbol})`);

  const data = await res.json();
  if (data?.status === "error") {
    throw new Error(`${data?.message || "Twelve Data sin datos"} (${symbol})`);
  }

  const price = toNum(data?.close);
  if (!price || price <= 0) throw new Error(`Twelve Data sin datos (${symbol})`);

  return {
    symbol,
    shortName: data?.name || "-",
    regularMarketPrice: price,
    regularMarketChange: toNum(data?.change),
    regularMarketChangePercent: toNum(data?.percent_change),
    regularMarketDayHigh: toNum(data?.high),
    regularMarketDayLow: toNum(data?.low),
    currency: data?.currency || "-",
    fullExchangeName: data?.exchange || data?.mic_code || "-",
    source: "Twelve Data",
  };
}

async function searchTwelve(query) {
  if (!TWELVE_DATA_API_KEY) return [];

  const url = `https://api.twelvedata.com/symbol_search?symbol=${encodeURIComponent(query)}&apikey=${encodeURIComponent(TWELVE_DATA_API_KEY)}`;
  const res = await fetch(url);
  if (!res.ok) return [];

  const data = await res.json();
  const rows = Array.isArray(data?.data) ? data.data : [];

  return rows
    .map((item) => ({
      symbol: compactText(item?.symbol).toUpperCase(),
      name: compactText(item?.instrument_name) || "-",
      exchange: compactText(item?.exchange) || compactText(item?.mic_code) || "-",
      source: "Twelve Data",
    }))
    .filter((item) => item.symbol);
}

module.exports = {
  fetchTwelveSymbol,
  searchTwelve,
};
