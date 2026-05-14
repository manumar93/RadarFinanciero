const { FINNHUB_API_KEY } = require("../config/env");
const { fetchWithTimeout } = require("../utils/fetch-with-timeout");
const { compactText, toNum } = require("../utils/text");

let finnhubSymbolsCache = null;
let finnhubSymbolsCacheTs = 0;
const FINNHUB_CACHE_TTL_MS = 1000 * 60 * 60 * 6;
const FINNHUB_QUOTE_TIMEOUT_MS = 7000;
const FINNHUB_SEARCH_TIMEOUT_MS = 7000;
const FINNHUB_SYMBOLS_TIMEOUT_MS = 12000;

async function fetchFinnhubSymbol(symbol) {
  if (!FINNHUB_API_KEY) throw new Error("Falta FINNHUB_API_KEY en el servidor");

  const quoteUrl = `https://finnhub.io/api/v1/quote?symbol=${encodeURIComponent(symbol)}&token=${encodeURIComponent(FINNHUB_API_KEY)}`;

  const quoteRes = await fetchWithTimeout(quoteUrl, {}, FINNHUB_QUOTE_TIMEOUT_MS);

  if (!quoteRes.ok) throw new Error(`Finnhub HTTP ${quoteRes.status} (${symbol})`);

  const quote = await quoteRes.json();

  if (quote?.error) throw new Error(`Finnhub sin acceso a ${symbol}`);

  const currentPrice = toNum(quote?.c);
  const prevClose = toNum(quote?.pc);
  const price = currentPrice > 0 ? currentPrice : prevClose;
  if (!price || price <= 0) throw new Error(`Finnhub sin datos (${symbol})`);

  const usingPrevClose = currentPrice <= 0 && prevClose > 0;

  return {
    symbol,
    shortName: "-",
    regularMarketPrice: price,
    regularMarketChange: usingPrevClose ? 0 : toNum(quote?.d),
    regularMarketChangePercent: usingPrevClose ? 0 : toNum(quote?.dp),
    regularMarketDayHigh: toNum(quote?.h) || price,
    regularMarketDayLow: toNum(quote?.l) || price,
    currency: "-",
    fullExchangeName: "-",
    source: usingPrevClose ? "Finnhub (cierre anterior)" : "Finnhub",
  };
}

async function searchFinnhub(query) {
  if (!FINNHUB_API_KEY) return [];

  const url = `https://finnhub.io/api/v1/search?q=${encodeURIComponent(query)}&token=${encodeURIComponent(FINNHUB_API_KEY)}`;
  const res = await fetchWithTimeout(url, {}, FINNHUB_SEARCH_TIMEOUT_MS);
  if (!res.ok) return [];

  const data = await res.json();
  const rows = Array.isArray(data?.result) ? data.result : [];

  return rows
    .map((item) => ({
      symbol: compactText(item?.symbol).toUpperCase(),
      name: compactText(item?.description) || "-",
      exchange: compactText(item?.displaySymbol) || "-",
      source: "Finnhub",
    }))
    .filter((item) => item.symbol && /^[A-Z]{2,6}$/.test(item.symbol));
}

async function fetchFinnhubUsSymbols() {
  if (!FINNHUB_API_KEY) throw new Error("Falta FINNHUB_API_KEY en el servidor");

  const now = Date.now();
  if (finnhubSymbolsCache && now - finnhubSymbolsCacheTs < FINNHUB_CACHE_TTL_MS) {
    return finnhubSymbolsCache;
  }

  const url = `https://finnhub.io/api/v1/stock/symbol?exchange=US&token=${encodeURIComponent(FINNHUB_API_KEY)}`;
  const res = await fetchWithTimeout(url, {}, FINNHUB_SYMBOLS_TIMEOUT_MS);
  if (!res.ok) throw new Error(`Finnhub symbols HTTP ${res.status}`);

  const data = await res.json();
  const rows = Array.isArray(data) ? data : [];
  finnhubSymbolsCache = rows;
  finnhubSymbolsCacheTs = now;
  return rows;
}

module.exports = {
  fetchFinnhubSymbol,
  searchFinnhub,
  fetchFinnhubUsSymbols,
};
