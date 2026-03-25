const { fetchFinnhubUsSymbols, fetchFinnhubSymbol, searchFinnhub } = require("./finnhub.provider");
const { fetchTwelveSymbol, searchTwelve } = require("./twelve-data.provider");
const { FINNHUB_API_KEY, TWELVE_DATA_API_KEY } = require("../config/env");
const { compactText, hasUsableName, normalizeText } = require("../utils/text");

function dedupeSearchRows(rows, limit = 30) {
  const bySymbol = new Map();

  rows.forEach((row) => {
    const key = row.symbol;
    if (!bySymbol.has(key)) {
      bySymbol.set(key, row);
      return;
    }

    const prev = bySymbol.get(key);
    const prevScore = (prev.name !== "-" ? 1 : 0) + (prev.exchange !== "-" ? 1 : 0);
    const nextScore = (row.name !== "-" ? 1 : 0) + (row.exchange !== "-" ? 1 : 0);
    if (nextScore > prevScore) bySymbol.set(key, row);
  });

  return [...bySymbol.values()].slice(0, limit);
}

async function fetchByProvider(symbol, provider) {
  if (provider === "finnhub") return [await fetchFinnhubSymbol(symbol)];
  if (provider === "twelve") return [await fetchTwelveSymbol(symbol)];

  if (provider === "compare") {
    const pair = await Promise.allSettled([
      FINNHUB_API_KEY
        ? fetchFinnhubSymbol(symbol)
        : Promise.reject(new Error("Sin FINNHUB_API_KEY")),
      TWELVE_DATA_API_KEY
        ? fetchTwelveSymbol(symbol)
        : Promise.reject(new Error("Sin TWELVE_DATA_API_KEY")),
    ]);

    const fulfilled = pair
      .filter((result) => result.status === "fulfilled")
      .map((result) => result.value);
    if (!fulfilled.length) {
      const firstError = pair.find((result) => result.status === "rejected");
      throw new Error(firstError?.reason?.message || `Sin datos en compare (${symbol})`);
    }

    return fulfilled;
  }

  let row = null;

  if (FINNHUB_API_KEY) {
    try {
      row = await fetchFinnhubSymbol(symbol);
    } catch (_) {}
  }

  if (TWELVE_DATA_API_KEY) {
    try {
      const twelveRow = await fetchTwelveSymbol(symbol);
      if (!row) return [twelveRow];

      if (!hasUsableName(row.shortName) && hasUsableName(twelveRow.shortName)) {
        row.shortName = twelveRow.shortName;
      }
      if (!hasUsableName(row.fullExchangeName) && hasUsableName(twelveRow.fullExchangeName)) {
        row.fullExchangeName = twelveRow.fullExchangeName;
      }
      if (!hasUsableName(row.currency) && hasUsableName(twelveRow.currency)) {
        row.currency = twelveRow.currency;
      }
    } catch (_) {}
  }

  return row ? [row] : [];
}

function isLikelyFund(row) {
  const typeText = normalizeText(row?.type);
  const descriptionText = normalizeText(row?.description);

  if (
    typeText.includes("etf") ||
    typeText.includes("etn") ||
    typeText.includes("fund") ||
    typeText.includes("trust")
  ) {
    return true;
  }

  return (
    descriptionText.includes(" etf") ||
    descriptionText.includes(" fund") ||
    descriptionText.includes("trust") ||
    descriptionText.includes("exchange traded fund")
  );
}

function classifyCategory(row) {
  const descriptionText = normalizeText(row?.description);
  const moneyWords = [
    "money market",
    "ultra short",
    "treasury bill",
    "t-bill",
    "0-3 month",
    "1-3 month",
    "cash",
    "liquidity",
    "floating",
    "short-term",
  ];
  const bondWords = [
    "bond",
    "treasury",
    "corporate",
    "fixed income",
    "tips",
    "muni",
    "aggregate",
    "high yield",
    "loan",
    "income",
  ];
  const mixedWords = [
    "allocation",
    "balanced",
    "multi-asset",
    "asset allocation",
    "target risk",
    "risk managed",
  ];

  if (moneyWords.some((word) => descriptionText.includes(word))) return "money";
  if (bondWords.some((word) => descriptionText.includes(word))) return "bonds";
  if (mixedWords.some((word) => descriptionText.includes(word))) return "mixed";
  return "equity";
}

async function discoverCategorySymbols(category, limit) {
  const rows = await fetchFinnhubUsSymbols();
  const funds = rows.filter((row) => isLikelyFund(row) && compactText(row?.symbol));

  const symbols = funds
    .filter((row) => classifyCategory(row) === category)
    .map((row) => compactText(row.symbol).toUpperCase())
    .filter(Boolean);

  return [...new Set(symbols)].slice(0, limit);
}

module.exports = {
  searchFinnhub,
  searchTwelve,
  dedupeSearchRows,
  fetchByProvider,
  discoverCategorySymbols,
};
