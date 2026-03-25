const { FINNHUB_API_KEY } = require("../config/env");
const { compactText, toNum } = require("../utils/text");

let finnhubSymbolsCache = null;
let finnhubSymbolsCacheTs = 0;
const FINNHUB_CACHE_TTL_MS = 1000 * 60 * 60 * 6;

async function fetchFinnhubSymbol(symbol) {
  if (!FINNHUB_API_KEY) throw new Error("Falta FINNHUB_API_KEY en el servidor");

  const quoteUrl = `https://finnhub.io/api/v1/quote?symbol=${encodeURIComponent(symbol)}&token=${encodeURIComponent(FINNHUB_API_KEY)}`;
  const profileUrl = `https://finnhub.io/api/v1/stock/profile2?symbol=${encodeURIComponent(symbol)}&token=${encodeURIComponent(FINNHUB_API_KEY)}`;
  const etfProfileUrl = `https://finnhub.io/api/v1/etf/profile?symbol=${encodeURIComponent(symbol)}&token=${encodeURIComponent(FINNHUB_API_KEY)}`;

  const [quoteRes, profileRes, etfProfileRes] = await Promise.all([
    fetch(quoteUrl),
    fetch(profileUrl),
    fetch(etfProfileUrl),
  ]);

  if (!quoteRes.ok) throw new Error(`Finnhub HTTP ${quoteRes.status} (${symbol})`);

  const quote = await quoteRes.json();
  const profile = profileRes.ok ? await profileRes.json() : {};
  const etfProfile = etfProfileRes.ok ? await etfProfileRes.json() : {};

  const price = toNum(quote?.c);
  if (!price || price <= 0) throw new Error(`Finnhub sin datos (${symbol})`);

  return {
    symbol,
    shortName: profile?.name || etfProfile?.name || "-",
    regularMarketPrice: price,
    regularMarketChange: toNum(quote?.d),
    regularMarketChangePercent: toNum(quote?.dp),
    regularMarketDayHigh: toNum(quote?.h),
    regularMarketDayLow: toNum(quote?.l),
    currency: profile?.currency || "-",
    fullExchangeName: profile?.exchange || "-",
    source: "Finnhub",
  };
}

async function searchFinnhub(query) {
  if (!FINNHUB_API_KEY) return [];

  const url = `https://finnhub.io/api/v1/search?q=${encodeURIComponent(query)}&token=${encodeURIComponent(FINNHUB_API_KEY)}`;
  const res = await fetch(url);
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
    .filter((item) => item.symbol);
}

async function fetchFinnhubUsSymbols() {
  if (!FINNHUB_API_KEY) throw new Error("Falta FINNHUB_API_KEY en el servidor");

  const now = Date.now();
  if (finnhubSymbolsCache && now - finnhubSymbolsCacheTs < FINNHUB_CACHE_TTL_MS) {
    return finnhubSymbolsCache;
  }

  const url = `https://finnhub.io/api/v1/stock/symbol?exchange=US&token=${encodeURIComponent(FINNHUB_API_KEY)}`;
  const res = await fetch(url);
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
