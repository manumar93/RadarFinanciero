const { fetchFinnhubUsSymbols, fetchFinnhubSymbol, searchFinnhub } = require("./finnhub.provider");
const { fetchTwelveSymbol, searchTwelve } = require("./twelve-data.provider");
const { FINNHUB_API_KEY, TWELVE_DATA_API_KEY } = require("../config/env");
const { mapWithConcurrency } = require("../utils/async");
const { compactText, normalizeText } = require("../utils/text");

const quoteCache = new Map();
const discoveryCache = new Map();
const QUOTE_CACHE_TTL_MS = 1000 * 60 * 2;
const DISCOVERY_CACHE_TTL_MS = 1000 * 60 * 30;
const CATEGORY_WORDS = {
  money: [
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
    "short term",
  ],
  bonds: [
    "bond",
    "treasury",
    "corporate",
    "fixed income",
    "tips",
    "muni",
    "municipal",
    "aggregate",
    "high yield",
    "loan",
    "income",
  ],
  mixed: [
    "allocation",
    "balanced",
    "multi-asset",
    "multi asset",
    "asset allocation",
    "target risk",
    "risk managed",
  ],
};
const TWELVE_CATEGORY_QUERIES = {
  money: [
    "money market",
    "treasury bill",
    "t-bill",
    "ultra short",
    "short term treasury",
    "cash",
    "liquidity",
  ],
  bonds: [
    "bond etf",
    "treasury bond",
    "corporate bond",
    "aggregate bond",
    "high yield bond",
    "municipal bond",
  ],
  mixed: ["allocation fund", "balanced fund", "multi asset", "target risk"],
  equity: ["equity etf", "stock etf", "index fund"],
};
const CATEGORY_BASE_SYMBOLS = {
  money: [
    "BIL",
    "SHV",
    "SGOV",
    "MINT",
    "JPST",
    "ICSH",
    "GBIL",
    "VGSH",
    "SCHO",
    "SHY",
    "NEAR",
    "ULST",
    "TFLO",
    "USFR",
    "FLOT",
    "TBIL",
    "CLTL",
    "BILS",
    "XBIL",
    "MEAR",
  ],
  bonds: [
    "AGG",
    "BND",
    "IEF",
    "TLT",
    "LQD",
    "BNDX",
    "HYG",
    "EMB",
    "VCIT",
    "VCSH",
    "TIP",
    "SHYG",
    "JNK",
    "BKLN",
    "IGSB",
    "SCHZ",
    "GOVT",
    "MBB",
    "BIV",
    "BLV",
  ],
  mixed: [
    "AOR",
    "AOM",
    "AOA",
    "AOK",
    "NTSX",
    "RPAR",
    "GAL",
    "MDIV",
    "GAA",
    "PCEF",
    "RLY",
    "DGRW",
    "CWB",
    "JEPI",
    "JEPQ",
    "VYM",
    "VIG",
    "SCHD",
    "HDV",
    "USMV",
  ],
  equity: [
    "SPY",
    "IVV",
    "VOO",
    "VTI",
    "VT",
    "VEA",
    "VWO",
    "QQQ",
    "IWM",
    "ACWI",
    "DIA",
    "SCHB",
    "ITOT",
    "SPLG",
    "VUG",
    "VTV",
    "IWF",
    "IWD",
    "XLK",
    "XLF",
  ],
};

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
  const cacheKey = `${provider}:${symbol}`;
  const cached = quoteCache.get(cacheKey);
  if (cached && Date.now() - cached.ts < QUOTE_CACHE_TTL_MS) {
    return cached.rows;
  }

  let rows = [];

  if (provider === "finnhub") {
    rows = [await fetchFinnhubSymbol(symbol)];
    quoteCache.set(cacheKey, { ts: Date.now(), rows });
    return rows;
  }

  if (provider === "twelve") {
    rows = [await fetchTwelveSymbol(symbol)];
    quoteCache.set(cacheKey, { ts: Date.now(), rows });
    return rows;
  }

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

    quoteCache.set(cacheKey, { ts: Date.now(), rows: fulfilled });
    return fulfilled;
  }

  let row = null;

  if (FINNHUB_API_KEY) {
    try {
      row = await fetchFinnhubSymbol(symbol);
    } catch (_) {}
  }

  if (!row && TWELVE_DATA_API_KEY) {
    try {
      row = await fetchTwelveSymbol(symbol);
    } catch (_) {}
  }

  rows = row ? [row] : [];
  if (rows.length) {
    quoteCache.set(cacheKey, { ts: Date.now(), rows });
  }
  return rows;
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
  return classifyCategoryText(row?.description);
}

function classifyCategoryText(input) {
  const text = normalizeText(input);

  if (CATEGORY_WORDS.money.some((word) => text.includes(word))) return "money";
  if (CATEGORY_WORDS.bonds.some((word) => text.includes(word))) return "bonds";
  if (CATEGORY_WORDS.mixed.some((word) => text.includes(word))) return "mixed";
  return "equity";
}

function classifyTwelveSearchRow(row) {
  return classifyCategoryText(`${row?.name || ""} ${row?.symbol || ""} ${row?.type || ""}`);
}

async function discoverFinnhubCategorySymbols(category) {
  if (!FINNHUB_API_KEY) return [];

  const rows = await fetchFinnhubUsSymbols();
  const funds = rows.filter((row) => isLikelyFund(row) && compactText(row?.symbol));

  return funds
    .filter((row) => classifyCategory(row) === category)
    .map((row) => compactText(row.symbol).toUpperCase())
    .filter(Boolean);
}

async function discoverTwelveCategorySymbols(category) {
  if (!TWELVE_DATA_API_KEY) return [];

  const queries = TWELVE_CATEGORY_QUERIES[category] || [];
  const settled = await mapWithConcurrency(queries, 2, (query) => searchTwelve(query));

  return settled
    .filter((result) => result.status === "fulfilled")
    .flatMap((result) => result.value)
    .filter((row) => classifyTwelveSearchRow(row) === category)
    .map((row) => compactText(row.symbol).toUpperCase())
    .filter(Boolean);
}

async function discoverCategorySymbols(category, limit) {
  const cacheKey = `${category}:${limit}`;
  const cached = discoveryCache.get(cacheKey);
  if (cached && Date.now() - cached.ts < DISCOVERY_CACHE_TTL_MS) {
    return cached.symbols;
  }

  const baseSymbols = CATEGORY_BASE_SYMBOLS[category] || [];
  const immediateSymbols = baseSymbols.slice(0, limit);

  Promise.allSettled([
    discoverFinnhubCategorySymbols(category),
    discoverTwelveCategorySymbols(category),
  ]).then((discovered) => {
    const finnhubSymbols = discovered[0].status === "fulfilled" ? discovered[0].value : [];
    const twelveSymbols = discovered[1].status === "fulfilled" ? discovered[1].value : [];
    const candidates = [...new Set([...baseSymbols, ...twelveSymbols, ...finnhubSymbols])].slice(
      0,
      limit
    );
    if (candidates.length) {
      discoveryCache.set(cacheKey, { ts: Date.now(), symbols: candidates });
    }
  });

  return immediateSymbols;
}

module.exports = {
  searchFinnhub,
  searchTwelve,
  dedupeSearchRows,
  fetchByProvider,
  discoverCategorySymbols,
};
