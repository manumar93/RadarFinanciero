const presets = {
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
    "GSY",
    "PULS",
    "SPSB",
    "FLRN",
    "TFLO",
    "USFR",
    "FLOT",
    "CLTL",
    "BILS",
    "TBIL",
    "XBIL",
    "MEAR",
    "LDUR",
    "VUSB",
    "JPST",
    "MUB",
    "SHM",
    "SUB",
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
    "SRLN",
    "IGSB",
    "SPSB",
    "SCHZ",
    "GOVT",
    "SCHR",
    "SPTI",
    "SPTL",
    "MBB",
    "CMBS",
    "VMBS",
    "BIV",
    "BLV",
    "EDV",
    "BWX",
    "WIP",
    "HYLB",
    "ANGL",
    "FALN",
    "IGLB",
    "USIG",
    "SPIB",
    "IUSB",
    "FBND",
    "TOTL",
    "MUB",
    "HYD",
    "PFFD",
  ],
  mixed: [
    "AOR",
    "AOM",
    "AOA",
    "VTIP",
    "SCHP",
    "NTSX",
    "RPAR",
    "VTMFX",
    "FFNOX",
    "SWAN",
    "VBIAX",
    "VSMGX",
    "VSCGX",
    "VASGX",
    "VSMAX",
    "AOK",
    "AOA",
    "AOM",
    "AOR",
    "GAL",
    "MDIV",
    "CVY",
    "GAA",
    "PCEF",
    "RLY",
    "RPAR",
    "RISR",
    "TRTY",
    "DGRW",
    "CWB",
    "SPYI",
    "JEPI",
    "JEPQ",
    "NUSI",
    "QYLD",
    "XYLD",
    "RYLD",
    "SCHY",
    "VYM",
    "VIG",
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
    "VWCE",
    "EUNL",
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
    "XLV",
    "XLI",
    "XLY",
    "XLP",
    "XLE",
    "XLU",
    "XLB",
    "XLRE",
    "SMH",
    "SOXX",
    "EFA",
    "IEFA",
    "EWJ",
    "EWG",
    "EWU",
    "EWC",
    "EWZ",
    "INDA",
    "MCHI",
    "ARKK",
    "DGRO",
    "VIG",
    "SCHD",
    "HDV",
    "USMV",
    "MTUM",
    "VEU",
    "VXUS",
    "SPDW",
    "SPEM",
    "IEMG",
    "EEM",
    "FXI",
    "KWEB",
    "EWY",
    "EWT",
    "EWA",
    "EWH",
    "VGT",
    "VHT",
    "VIS",
    "VFH",
    "VDE",
    "VPU",
    "VNQ",
    "VOX",
    "RSP",
    "MDY",
    "IJH",
    "VB",
    "SCHA",
    "VTWO",
    "AVUV",
    "QUAL",
    "SIZE",
    "SPLV",
    "QQQM",
    "SCHG",
    "IWY",
    "IWN",
    "IWO",
    "SCZ",
  ],
};

const loadBtn = document.getElementById("loadBtn");
const providerSelect = document.getElementById("providerSelect");
const searchInput = document.getElementById("searchInput");
const searchBtn = document.getElementById("searchBtn");
const searchResults = document.getElementById("searchResults");
const prevPageBtn = document.getElementById("prevPageBtn");
const nextPageBtn = document.getElementById("nextPageBtn");
const pageInfo = document.getElementById("pageInfo");
const categoryNavButtons = Array.from(document.querySelectorAll("[data-category-nav]"));
const topNav = document.getElementById("headerMount");
const topCategoryPanel = document.getElementById("topCategoryPanel");
const categoryOptionLists = {
  money: document.getElementById("catMoney"),
  bonds: document.getElementById("catBonds"),
  mixed: document.getElementById("catMixed"),
  equity: document.getElementById("catEquity"),
};
const heatmapGrid = document.getElementById("heatmapGrid");
const emptyState = document.getElementById("emptyState");
const countStat = document.getElementById("countStat");
const bestStat = document.getElementById("bestStat");
const worstStat = document.getElementById("worstStat");
const avgStat = document.getElementById("avgStat");
const authStatusTitle = document.getElementById("authStatusTitle");
const authStatusMeta = document.getElementById("authStatusMeta");
const authActionsMount = document.getElementById("authActionsMount");
const loginLink = document.getElementById("loginLink");
const registerLink = document.getElementById("registerLink");

let allRows = [];
let currentPage = 1;
let selectedSymbols = [];
let openCategoryKey = null;
let favoriteSymbols = new Set();
const categorySelections = {
  money: "",
  bonds: "",
  mixed: "",
  equity: "",
};
const STORAGE_KEY_PROVIDER = "radarfinanciero-provider";
const STORAGE_KEY_FAVORITES = "radarfinanciero-favorites";
const LEGACY_STORAGE_KEY_PROVIDER = `fund${"scanner"}-provider`;
const LEGACY_STORAGE_KEY_FAVORITES = `fund${"scanner"}-favorites`;
const MAX_SYMBOLS_PER_BATCH = 35;
const PAGE_SIZE = 30;
const DISCOVER_LIMIT_PER_CATEGORY = 300;
const SYMBOL_NAME_MAP = {
  SPY: "SPDR S&P 500 ETF",
  IVV: "iShares Core S&P 500 ETF",
  VOO: "Vanguard S&P 500 ETF",
  VTI: "Vanguard Total Stock Market ETF",
  VT: "Vanguard Total World Stock ETF",
  VEA: "Vanguard FTSE Developed Markets ETF",
  VWO: "Vanguard FTSE Emerging Markets ETF",
  QQQ: "Invesco QQQ Trust",
  IWM: "iShares Russell 2000 ETF",
  ACWI: "iShares MSCI ACWI ETF",
  BND: "Vanguard Total Bond Market ETF",
  AGG: "iShares Core US Aggregate Bond ETF",
  IEF: "iShares 7-10 Year Treasury Bond ETF",
  TLT: "iShares 20+ Year Treasury Bond ETF",
  LQD: "iShares iBoxx Investment Grade Corporate Bond ETF",
  TIP: "iShares TIPS Bond ETF",
  HYG: "iShares iBoxx High Yield Corporate Bond ETF",
  EMB: "iShares J.P. Morgan USD Emerging Markets Bond ETF",
  BIL: "SPDR Bloomberg 1-3 Month T-Bill ETF",
  SHV: "iShares Short Treasury Bond ETF",
  SGOV: "iShares 0-3 Month Treasury Bond ETF",
  MINT: "PIMCO Enhanced Short Maturity Active ETF",
  JPST: "JPMorgan Ultra-Short Income ETF",
  ICSH: "iShares Ultra Short-Term Bond ETF",
  VGSH: "Vanguard Short-Term Treasury ETF",
  SHY: "iShares 1-3 Year Treasury Bond ETF",
  SCHP: "Schwab US TIPS ETF",
  VTIP: "Vanguard Short-Term Inflation-Protected Securities ETF",
  VIG: "Vanguard Dividend Appreciation ETF",
  SCHD: "Schwab US Dividend Equity ETF",
  HDV: "iShares Core High Dividend ETF",
  USMV: "iShares MSCI USA Min Vol Factor ETF",
  MTUM: "iShares MSCI USA Momentum Factor ETF",
  VNQ: "Vanguard Real Estate ETF",
  XLK: "Technology Select Sector SPDR Fund",
  XLF: "Financial Select Sector SPDR Fund",
  XLV: "Health Care Select Sector SPDR Fund",
  XLI: "Industrial Select Sector SPDR Fund",
  XLY: "Consumer Discretionary Select Sector SPDR Fund",
  XLP: "Consumer Staples Select Sector SPDR Fund",
  XLE: "Energy Select Sector SPDR Fund",
  XLU: "Utilities Select Sector SPDR Fund",
  XLB: "Materials Select Sector SPDR Fund",
  XLRE: "Real Estate Select Sector SPDR Fund",
  DIA: "SPDR Dow Jones Industrial Average ETF",
  EFA: "iShares MSCI EAFE ETF",
  IEFA: "iShares Core MSCI EAFE ETF",
  EEM: "iShares MSCI Emerging Markets ETF",
  IEMG: "iShares Core MSCI Emerging Markets ETF",
  VXUS: "Vanguard Total International Stock ETF",
  VEU: "Vanguard FTSE All-World ex-US ETF",
  SOXX: "iShares Semiconductor ETF",
  SMH: "VanEck Semiconductor ETF",
};
const CATEGORY_LABELS = {
  money: "Monetarios",
  bonds: "Renta fija",
  mixed: "Mixto defensivo",
  equity: "Renta variable global",
};

function upsertSymbols(symbolsToAdd) {
  const merged = [...new Set([...selectedSymbols, ...symbolsToAdd])];
  selectedSymbols = merged;
  return merged;
}

function formatNum(value, digits = 2) {
  if (typeof value !== "number" || Number.isNaN(value)) return "-";
  return value.toLocaleString("es-ES", {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  });
}

function firstValidText(...values) {
  for (const value of values) {
    if (typeof value !== "string") continue;
    const clean = value.trim();
    if (clean && clean !== "-") return clean;
  }
  return "-";
}

function displayNameForRow(row) {
  const apiName = firstValidText(row.shortName, row.longName);
  if (apiName !== "-") return apiName;
  if (row.symbol && SYMBOL_NAME_MAP[row.symbol]) return SYMBOL_NAME_MAP[row.symbol];
  if (row.symbol) return `Fondo ${row.symbol}`;
  return "Nombre no disponible";
}

function saveSettings() {
  localStorage.setItem(STORAGE_KEY_PROVIDER, providerSelect.value);
  localStorage.setItem(STORAGE_KEY_FAVORITES, JSON.stringify([...favoriteSymbols]));
}

function loadSettings() {
  const savedProvider =
    localStorage.getItem(STORAGE_KEY_PROVIDER) || localStorage.getItem(LEGACY_STORAGE_KEY_PROVIDER);
  if (savedProvider && !localStorage.getItem(STORAGE_KEY_PROVIDER)) {
    localStorage.setItem(STORAGE_KEY_PROVIDER, savedProvider);
    localStorage.removeItem(LEGACY_STORAGE_KEY_PROVIDER);
  }
  providerSelect.value = savedProvider || "auto";
  try {
    const savedFavorites =
      localStorage.getItem(STORAGE_KEY_FAVORITES) ||
      localStorage.getItem(LEGACY_STORAGE_KEY_FAVORITES) ||
      "[]";
    if (savedFavorites !== "[]" && !localStorage.getItem(STORAGE_KEY_FAVORITES)) {
      localStorage.setItem(STORAGE_KEY_FAVORITES, savedFavorites);
      localStorage.removeItem(LEGACY_STORAGE_KEY_FAVORITES);
    }
    const parsed = JSON.parse(savedFavorites);
    favoriteSymbols = new Set(
      Array.isArray(parsed) ? parsed.map((s) => String(s).toUpperCase()) : []
    );
  } catch (_) {
    favoriteSymbols = new Set();
  }
}

function adjustHeaderOffset() {
  const navHeight = topNav ? Math.ceil(topNav.getBoundingClientRect().height) : 78;
  document.documentElement.style.setProperty("--header-h", `${navHeight}px`);
}

async function refreshAuthStrip() {
  const authPayload = await window.FundRadarAuth.fetchCurrentUser();
  const logoutBtn = document.getElementById("logoutBtn");
  if (!authPayload?.user) {
    window.__FUND_RADAR_AUTH__ = null;
    authStatusTitle.textContent = "Sesion no iniciada";
    authStatusMeta.textContent =
      "Puedes entrar para activar perfil, carteras y favoritos persistentes.";
    if (authActionsMount) authActionsMount.style.display = "flex";
    loginLink.hidden = false;
    registerLink.hidden = false;
    if (logoutBtn) logoutBtn.hidden = true;
    return;
  }

  window.__FUND_RADAR_AUTH__ = authPayload;
  const displayName =
    authPayload.profile?.full_name ||
    authPayload.user.user_metadata?.full_name ||
    authPayload.user.email;
  authStatusTitle.textContent = `Sesion activa: ${displayName}`;
  authStatusMeta.textContent = authPayload.user.email || "Usuario autenticado";
  if (authActionsMount) authActionsMount.style.display = "none";
  loginLink.hidden = true;
  registerLink.hidden = true;
  if (logoutBtn) logoutBtn.hidden = false;
}

async function loadDashboardChrome() {
  const mounts = [
    { id: "headerMount", file: "./partials/dashboard-header.html" },
    { id: "asideMount", file: "./partials/dashboard-aside.html" },
  ];

  await Promise.all(
    mounts.map(async ({ id, file }) => {
      const mount = document.getElementById(id);
      if (!mount) return;
      try {
        const bust = `v=${Date.now()}`;
        const url = file.includes("?") ? `${file}&${bust}` : `${file}?${bust}`;
        const response = await fetch(url, { cache: "no-store" });
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        mount.innerHTML = await response.text();
      } catch (error) {
        mount.innerHTML = "";
        console.error(`No se pudo cargar ${file}:`, error);
      }
    })
  );

  const sidebar = document.getElementById("sidebar");
  if (authActionsMount && sidebar) {
    const sidebarContent = sidebar.querySelector(".flex.flex-col.h-full");
    if (sidebarContent) {
      sidebarContent.appendChild(authActionsMount);
    }
  }

  initDashboardChrome();
  adjustHeaderOffset();
}

function initDashboardChrome() {
  const body = document.body;
  const sidebar = document.getElementById("sidebar");
  const overlay = document.getElementById("overlay");
  const menuToggle = document.getElementById("menuToggle");
  const closeSidebar = document.getElementById("closeSidebar");

  const openSidebar = () => body.classList.add("sidebar-open");
  const closeSidebarPanel = () => body.classList.remove("sidebar-open");

  menuToggle?.addEventListener("click", openSidebar);
  closeSidebar?.addEventListener("click", closeSidebarPanel);
  overlay?.addEventListener("click", closeSidebarPanel);

  window.addEventListener("resize", () => {
    if (window.innerWidth > 920) closeSidebarPanel();
  });

  const dropdownPairs = [
    ["btnMyProducts", "productsMenu", "productsArrow"],
    ["btnPromotions", "promotionsMenu", "promotionsArrow"],
    ["btnSales", "salesMenu", "salesArrow"],
  ];

  dropdownPairs.forEach(([buttonId, menuId, arrowId]) => {
    const button = document.getElementById(buttonId);
    const menu = document.getElementById(menuId);
    const arrow = document.getElementById(arrowId);
    if (!button || !menu) return;

    button.addEventListener("click", () => {
      const isOpen = menu.classList.toggle("is-open");
      menu.classList.toggle("hidden", !isOpen);
      if (arrow) {
        arrow.style.transform = isOpen ? "rotate(180deg)" : "";
      }
    });
  });

  sidebar?.querySelectorAll("a").forEach((link) => {
    link.addEventListener("click", () => {
      if (window.innerWidth <= 920) closeSidebarPanel();
    });
  });

  const logoutBtn = document.getElementById("logoutBtn");
  const logoutDialog = document.getElementById("logoutDialog");
  const logoutDialogBackdrop = document.getElementById("logoutDialogBackdrop");
  const logoutCancel = document.getElementById("logoutCancel");
  const logoutOk = document.getElementById("logoutOk");
  logoutBtn?.addEventListener("click", (event) => {
    event.preventDefault();
    logoutDialog?.showModal?.();
  });
  logoutDialogBackdrop?.addEventListener("click", () => logoutDialog?.close());
  logoutCancel?.addEventListener("click", () => logoutDialog?.close());
  logoutOk?.addEventListener("click", async () => {
    await window.FundRadarAuth.logoutFromWeb();
    logoutDialog?.close();
    await refreshAuthStrip();
    window.location.href = "/login.html";
  });

  const userName = document.getElementById("userName");
  const userEmail = document.getElementById("userEmail");
  const planName = document.getElementById("planNameHeader");
  const daysCounter = document.getElementById("daysCounter");
  const daysLabel = document.getElementById("daysLabelText");
  const notificationList = document.getElementById("notificationList");
  const messagesList = document.getElementById("messagesListSeller");
  const authPayload = window.__FUND_RADAR_AUTH__;
  const authUser = authPayload?.user || null;
  const authProfile = authPayload?.profile || null;
  const displayName =
    authProfile?.full_name ||
    authUser?.user_metadata?.full_name ||
    authUser?.email ||
    "RadarFinanciero";

  if (userName) userName.textContent = displayName;
  if (userEmail) userEmail.textContent = authUser?.email || "panel@fondos.local";
  if (planName) planName.textContent = authUser ? "Cuenta" : "Panel";
  if (daysCounter) daysCounter.textContent = authUser ? "1" : "24";
  if (daysLabel) daysLabel.textContent = authUser ? "sesion activa" : "widgets listos";
  if (notificationList) {
    notificationList.innerHTML =
      '<div class="p-4 text-sm" style="color:#cbd5e1;">No hay notificaciones para esta demo.</div>';
  }
  if (messagesList) {
    messagesList.innerHTML =
      '<div class="p-4 text-sm" style="color:#cbd5e1;">Sin mensajes pendientes.</div>';
  }
}

function initCategoryDropdowns() {
  Object.entries(categoryOptionLists).forEach(([key, container]) => {
    const uniqueTickers = [...new Set(presets[key])];
    const items = [
      { value: "", label: "Sin selección" },
      { value: "__all", label: "Todos (máximo API)" },
      ...uniqueTickers.map((ticker) => ({ value: ticker, label: ticker })),
    ];
    container.innerHTML = items
      .map(
        (item) => `
          <button class="cat-option ${item.value === categorySelections[key] ? "active" : ""}" data-key="${key}" data-value="${item.value}" type="button">${item.label}</button>
        `
      )
      .join("");
  });
  updateCategoryNavLabels();
}

function updateCategoryNavLabels() {
  categoryNavButtons.forEach((btn) => {
    const key = btn.dataset.categoryNav;
    const value = categorySelections[key];
    if (!value) {
      btn.textContent = CATEGORY_LABELS[key];
      return;
    }
    btn.textContent = value === "__all" ? `${CATEGORY_LABELS[key]}: Todos` : value;
  });
}

async function discoverCategorySymbols(category) {
  const url = `/api/discover?category=${encodeURIComponent(category)}&limit=${DISCOVER_LIMIT_PER_CATEGORY}`;
  const res = await fetch(url, { cache: "no-store" });
  const data = await res.json();
  if (!res.ok || data?.error) {
    throw new Error(data?.error || `HTTP ${res.status}`);
  }
  return Array.isArray(data?.symbols) ? data.symbols : [];
}

async function syncSymbolsFromCategories() {
  const picked = [];
  for (const [key, value] of Object.entries(categorySelections)) {
    if (!value) continue;
    if (value !== "__all") {
      picked.push(value);
      continue;
    }
    try {
      const discovered = await discoverCategorySymbols(key);
      if (discovered.length) {
        picked.push(...discovered);
      } else {
        picked.push(...presets[key]);
      }
    } catch (_) {
      picked.push(...presets[key]);
    }
  }
  const symbols = [...new Set(picked)];
  selectedSymbols = symbols;
  if (symbols.length) fetchQuotes(symbols);
}

function paintStats(rows) {
  countStat.textContent = rows.length;
  if (!rows.length) {
    bestStat.textContent = "-";
    worstStat.textContent = "-";
    avgStat.textContent = "-";
    avgStat.className = "stat-value";
    return;
  }
  const sorted = rows
    .filter((r) => typeof r.regularMarketChangePercent === "number")
    .sort((a, b) => b.regularMarketChangePercent - a.regularMarketChangePercent);
  if (!sorted.length) return;
  const best = sorted[0];
  const worst = sorted[sorted.length - 1];
  const avg = sorted.reduce((acc, r) => acc + r.regularMarketChangePercent, 0) / sorted.length;
  bestStat.textContent = `${best.symbol} (${formatNum(best.regularMarketChangePercent)}%)`;
  worstStat.textContent = `${worst.symbol} (${formatNum(worst.regularMarketChangePercent)}%)`;
  avgStat.textContent = `${formatNum(avg)}%`;
  avgStat.className = `stat-value ${avg >= 0 ? "pos" : "neg"}`;
}

function colorForPerformance(pct) {
  if (typeof pct !== "number" || Number.isNaN(pct) || pct === 0) {
    return "rgb(88, 95, 105)";
  }
  const intensity = Math.min(Math.abs(pct), 3) / 3;
  if (pct > 0) {
    const light = Math.round(120 - intensity * 65);
    return `rgb(28, ${light}, 66)`;
  }
  const light = Math.round(110 - intensity * 60);
  return `rgb(${light}, 44, 50)`;
}

function hashSymbol(symbol) {
  let hash = 0;
  const txt = String(symbol || "");
  for (let i = 0; i < txt.length; i += 1) {
    hash = (hash * 31 + txt.charCodeAt(i)) % 1000003;
  }
  return hash;
}

function buildSparklinePoints(row) {
  const points = [];
  const width = 120;
  const height = 30;
  const pad = 2;
  const pct =
    typeof row.regularMarketChangePercent === "number" ? row.regularMarketChangePercent : 0;
  const close =
    typeof row.regularMarketPrice === "number" && row.regularMarketPrice > 0
      ? row.regularMarketPrice
      : 100;
  const pctFactor = 1 + pct / 100;
  const open = close / (Math.abs(pctFactor) < 0.0001 ? 1 : pctFactor);
  const dayLow =
    typeof row.regularMarketDayLow === "number" && row.regularMarketDayLow > 0
      ? row.regularMarketDayLow
      : Math.min(open, close) * 0.996;
  const dayHigh =
    typeof row.regularMarketDayHigh === "number" && row.regularMarketDayHigh > 0
      ? row.regularMarketDayHigh
      : Math.max(open, close) * 1.004;
  const minV = Math.min(dayLow, open, close);
  const maxV = Math.max(dayHigh, open, close);
  const range = Math.max(maxV - minV, maxV * 0.0025);
  const hash = hashSymbol(row.symbol);
  const phase = (hash % 360) * (Math.PI / 180);
  const waveAmp = range * (0.07 + (hash % 11) / 200);
  const steps = 20;
  for (let i = 0; i < steps; i += 1) {
    const t = i / (steps - 1);
    const trend = open + (close - open) * t;
    const wave =
      Math.sin(t * 7.2 + phase) * waveAmp + Math.cos(t * 5.1 + phase * 0.7) * (waveAmp * 0.55);
    const value = Math.min(maxV, Math.max(minV, trend + wave));
    const x = pad + t * (width - pad * 2);
    const yNorm = (value - minV) / range;
    const y = height - pad - yNorm * (height - pad * 2);
    points.push(`${x.toFixed(2)},${y.toFixed(2)}`);
  }
  return points.join(" ");
}

function renderHeatmap() {
  heatmapGrid.innerHTML = "";
  if (!allRows.length) {
    emptyState.style.display = "block";
    pageInfo.textContent = "Página 0/0";
    prevPageBtn.disabled = true;
    nextPageBtn.disabled = true;
    return;
  }
  const sourceRows = allRows;
  if (!sourceRows.length) {
    emptyState.style.display = "block";
    emptyState.textContent = "No hay fondos para mostrar.";
    pageInfo.textContent = "Página 0/0";
    prevPageBtn.disabled = true;
    nextPageBtn.disabled = true;
    return;
  }
  emptyState.style.display = "none";
  const totalPages = Math.max(1, Math.ceil(sourceRows.length / PAGE_SIZE));
  currentPage = Math.min(Math.max(1, currentPage), totalPages);
  const start = (currentPage - 1) * PAGE_SIZE;
  const visibleRows = sourceRows.slice(start, start + PAGE_SIZE);
  pageInfo.textContent = `Página ${currentPage}/${totalPages} (${sourceRows.length} fondos)`;
  prevPageBtn.disabled = currentPage <= 1;
  nextPageBtn.disabled = currentPage >= totalPages;

  visibleRows.forEach((row, idx) => {
    const pct = row.regularMarketChangePercent;
    const symbol = (row.symbol || "").toUpperCase();
    const isFav = symbol && favoriteSymbols.has(symbol);
    const sparkline = buildSparklinePoints(row);
    const tile = document.createElement("article");
    tile.className = "heat-tile";
    tile.style.setProperty("--tile-accent", colorForPerformance(pct));
    tile.style.animationDelay = `${Math.min(idx * 0.02, 0.35)}s`;
    tile.innerHTML = `
          <div class="heat-top">
            <span></span>
            <button class="fav-btn ${isFav ? "active" : ""}" type="button" data-favorite-symbol="${symbol}" aria-label="Favorito">${isFav ? "★" : "☆"}</button>
          </div>
          <div class="heat-name">${displayNameForRow(row)}</div>
          <div class="heat-pct ${typeof pct === "number" ? (pct >= 0 ? "pos" : "neg") : ""}">${typeof pct === "number" ? `${pct > 0 ? "+" : ""}${formatNum(pct)}%` : "0.00%"}</div>
          <svg class="sparkline" viewBox="0 0 120 30" preserveAspectRatio="none" aria-hidden="true">
            <polyline class="spark-base" points="2,15 118,15"></polyline>
            <polyline points="${sparkline}"></polyline>
          </svg>
          <div class="heat-meta">${formatNum(row.regularMarketPrice)} ${row.currency ?? ""} | ${row.source ?? "-"}</div>
        `;
    heatmapGrid.appendChild(tile);
  });
}

function renderRows(rows) {
  allRows = rows;
  currentPage = 1;
  paintStats(rows);
  renderHeatmap();
}

function chunkSymbols(symbols, size) {
  const chunks = [];
  for (let i = 0; i < symbols.length; i += size) {
    chunks.push(symbols.slice(i, i + size));
  }
  return chunks;
}

async function fetchQuotes(symbols, forcedProvider = null) {
  if (!symbols.length) {
    emptyState.style.display = "block";
    emptyState.textContent = "No hay tickers seleccionados.";
    renderRows([]);
    return;
  }
  saveSettings();
  try {
    loadBtn.disabled = true;
    loadBtn.textContent = "Cargando...";
    const provider = forcedProvider || providerSelect.value;
    const chunks = chunkSymbols(symbols, MAX_SYMBOLS_PER_BATCH);
    const mergedRows = [];
    const errors = [];

    for (const chunk of chunks) {
      const endpoint = `/api/quote?symbols=${encodeURIComponent(chunk.join(","))}&provider=${encodeURIComponent(provider)}`;
      const res = await fetch(endpoint, { cache: "no-store" });
      const data = await res.json();
      if (!res.ok || data?.error) {
        errors.push(data?.error || `HTTP ${res.status}`);
        continue;
      }
      const rows = Array.isArray(data?.rows) ? data.rows : [];
      mergedRows.push(...rows);
    }

    if (!mergedRows.length) {
      if (!forcedProvider && provider !== "auto") {
        await fetchQuotes(symbols, "auto");
        return;
      }
      throw new Error(errors[0] || "Sin resultados para esos tickers.");
    }
    renderRows(mergedRows);
    if (errors.length) {
      emptyState.style.display = "block";
      emptyState.textContent = `Carga parcial: algunas tandas fallaron por límite de API (${errors[0]}).`;
    }
  } catch (err) {
    emptyState.style.display = "block";
    emptyState.textContent = `No se pudo cargar la cotización: ${err.message}. Revisa que estés en http://localhost:3000 y prueba 'Fuente: Auto'.`;
  } finally {
    loadBtn.disabled = false;
    loadBtn.textContent = "Cargar cotizaciones";
  }
}

async function searchTickers() {
  const query = searchInput.value.trim();
  if (query.length < 2) {
    searchResults.style.display = "block";
    searchResults.innerHTML = `<div class="result-item"><span>Escribe al menos 2 caracteres.</span></div>`;
    return;
  }
  try {
    searchBtn.disabled = true;
    searchBtn.textContent = "Buscando...";
    const provider = providerSelect.value;
    const url = `/api/search?q=${encodeURIComponent(query)}&provider=${encodeURIComponent(provider)}`;
    const res = await fetch(url, { cache: "no-store" });
    const data = await res.json();
    if (!res.ok || data?.error) throw new Error(data?.error || `HTTP ${res.status}`);
    const rows = Array.isArray(data?.rows) ? data.rows : [];
    searchResults.style.display = "block";
    if (!rows.length) {
      searchResults.innerHTML = `<div class="result-item"><span>Sin resultados</span></div>`;
      return;
    }
    searchResults.innerHTML = "";
    rows.forEach((row) => {
      const item = document.createElement("div");
      item.className = "result-item";
      item.innerHTML = `
            <div>
              <strong>${row.symbol}</strong> - ${row.name || "-"}
              <div class="result-meta">${row.exchange || "-"} | ${row.source || "-"}</div>
            </div>
            <button class="chip" data-symbol="${row.symbol}" type="button">Añadir</button>
          `;
      searchResults.appendChild(item);
    });
  } catch (err) {
    searchResults.style.display = "block";
    searchResults.innerHTML = `<div class="result-item"><span>Error: ${err.message}</span></div>`;
  } finally {
    searchBtn.disabled = false;
    searchBtn.textContent = "Buscar ticker";
  }
}

function runFromInput() {
  const symbols = [...selectedSymbols];
  if (!symbols.length) {
    emptyState.style.display = "block";
    emptyState.textContent = "No hay tickers seleccionados. Usa categorías o buscador.";
    renderRows([]);
    return;
  }
  fetchQuotes(symbols);
}

loadBtn.addEventListener("click", runFromInput);
searchBtn.addEventListener("click", searchTickers);
searchInput.addEventListener("keydown", (ev) => {
  if (ev.key === "Enter") searchTickers();
});
Object.values(categoryOptionLists).forEach((container) => {
  container.addEventListener("click", (ev) => {
    const btn = ev.target.closest(".cat-option");
    if (!btn) return;
    const key = btn.dataset.key;
    const value = btn.dataset.value ?? "";
    categorySelections[key] = value;
    initCategoryDropdowns();
    syncSymbolsFromCategories();
    openCategoryKey = null;
    categoryNavButtons.forEach((b) => {
      b.classList.remove("active");
    });
    topCategoryPanel.classList.remove("open");
  });
});
providerSelect.addEventListener("change", saveSettings);

categoryNavButtons.forEach((btn) => {
  btn.addEventListener("click", () => {
    const key = btn.dataset.categoryNav;
    categorySelections[key] = "__all";
    initCategoryDropdowns();
    syncSymbolsFromCategories();
    openCategoryKey = key;
    categoryNavButtons.forEach((b) => {
      b.classList.toggle("active", b.dataset.categoryNav === openCategoryKey);
    });
    topCategoryPanel.classList.toggle("open", Boolean(openCategoryKey));
    Object.entries(categoryOptionLists).forEach(([catKey, container]) => {
      container.classList.toggle("active", catKey === openCategoryKey);
    });
    adjustHeaderOffset();
  });
});

searchResults.addEventListener("click", (ev) => {
  const btn = ev.target.closest("button[data-symbol]");
  if (!btn) return;
  const symbols = upsertSymbols([btn.dataset.symbol]);
  fetchQuotes(symbols);
});
heatmapGrid.addEventListener("click", (ev) => {
  const btn = ev.target.closest("button[data-favorite-symbol]");
  if (!btn) return;
  const symbol = (btn.dataset.favoriteSymbol || "").toUpperCase();
  if (!symbol) return;
  if (favoriteSymbols.has(symbol)) {
    favoriteSymbols.delete(symbol);
  } else {
    favoriteSymbols.add(symbol);
  }
  saveSettings();
  renderHeatmap();
});

prevPageBtn.addEventListener("click", () => {
  currentPage -= 1;
  renderHeatmap();
});

nextPageBtn.addEventListener("click", () => {
  currentPage += 1;
  renderHeatmap();
});
loadSettings();
initCategoryDropdowns();
adjustHeaderOffset();
refreshAuthStrip().then(() => loadDashboardChrome());
window.addEventListener("resize", adjustHeaderOffset);
selectedSymbols = [];
if (window.location.protocol === "file:") {
  emptyState.style.display = "block";
  emptyState.textContent =
    "Estás abriendo el archivo local. Usa http://localhost:3000 para que funcionen las APIs.";
}
