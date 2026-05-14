const loadBtn = document.getElementById("loadBtn");
const searchInput = document.getElementById("searchInput");
const searchBtn = document.getElementById("searchBtn");
const searchResults = document.getElementById("searchResults");
const prevPageBtn = document.getElementById("prevPageBtn");
const nextPageBtn = document.getElementById("nextPageBtn");
const loadMoreCategoryBtn = document.getElementById("loadMoreCategoryBtn");
const pageInfo = document.getElementById("pageInfo");
const categoryNavButtons = Array.from(document.querySelectorAll("[data-category-nav]"));
const topNav = document.getElementById("headerMount");
const heatmapGrid = document.getElementById("heatmapGrid");
const emptyState = document.getElementById("emptyState");
const countStat = document.getElementById("countStat");
const bestStat = document.getElementById("bestStat");
const worstStat = document.getElementById("worstStat");
const authActionsMount = document.getElementById("authActionsMount");
const loginLink = document.getElementById("loginLink");
const registerLink = document.getElementById("registerLink");

let allRows = [];
let currentPage = 1;
let selectedSymbols = [];
let favoriteSymbols = new Set();
let activeQuoteRequestId = 0;
let activeCategoryKey = null;
let activeCategoryOffset = 0;
let isCategoryLoading = false;
const categorySymbolsCache = {};
const STORAGE_KEY_FAVORITES = "radarfinanciero-favorites";
const LEGACY_STORAGE_KEY_FAVORITES = `fund${"scanner"}-favorites`;
const MAX_SYMBOLS_PER_BATCH = 35;
const PAGE_SIZE = 20;
const CATEGORY_SYMBOL_LIMIT = 10;
const CATEGORY_RESULT_LIMIT = PAGE_SIZE;
const CATEGORY_PROVIDER = "auto";
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

function userHasActiveSession() {
  return Boolean(window.__FUND_RADAR_AUTH__?.user || window.FundRadarAuth?.getAccessToken?.());
}

function redirectToLogin() {
  window.location.href = "/login.html";
}

document.addEventListener(
  "click",
  (event) => {
    const button = event.target.closest("button");
    if (!button || userHasActiveSession()) return;

    event.preventDefault();
    event.stopImmediatePropagation();
    redirectToLogin();
  },
  true
);

function saveSettings() {
  localStorage.setItem(STORAGE_KEY_FAVORITES, JSON.stringify([...favoriteSymbols]));
}

function loadSettings() {
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

function placeAuthActions() {
  if (!authActionsMount) return;
  const sidebar = document.getElementById("sidebar");
  const sidebarContent = sidebar?.querySelector(".flex.flex-col.h-full");
  const headerActionsHost = document.querySelector("#header-principal > div:last-child");
  const isDesktop = window.innerWidth > 920;

  if (isDesktop && headerActionsHost) {
    headerActionsHost.appendChild(authActionsMount);
    return;
  }

  if (sidebarContent) {
    sidebarContent.appendChild(authActionsMount);
  }
}

async function refreshAuthStrip() {
  const authPayload = await window.FundRadarAuth.fetchCurrentUser();
  const logoutBtn = document.getElementById("logoutBtn");
  const logoutBtnHeader = document.getElementById("logoutBtnHeader");
  const userBlock = document.getElementById("userBlock");
  const userBlockSkeleton = document.getElementById("userBlockSkeleton");
  const subscriptionInfoContainer = document.getElementById("subscriptionInfoContainer");
  if (!authPayload?.user) {
    window.__FUND_RADAR_AUTH__ = null;
    if (authActionsMount) authActionsMount.style.display = "flex";
    loginLink.hidden = false;
    registerLink.hidden = false;
    if (logoutBtn) logoutBtn.hidden = true;
    if (logoutBtnHeader) logoutBtnHeader.hidden = true;
    if (userBlock) userBlock.classList.add("hidden");
    if (userBlockSkeleton) userBlockSkeleton.classList.add("hidden");
    if (subscriptionInfoContainer) subscriptionInfoContainer.style.visibility = "visible";
    placeAuthActions();
    return;
  }

  window.__FUND_RADAR_AUTH__ = authPayload;
  if (authActionsMount) authActionsMount.style.display = "none";
  loginLink.hidden = true;
  registerLink.hidden = true;
  if (logoutBtn) logoutBtn.hidden = false;
  if (logoutBtnHeader) logoutBtnHeader.hidden = false;
  if (userBlockSkeleton) userBlockSkeleton.classList.add("hidden");
  if (userBlock) userBlock.classList.remove("hidden");
  if (subscriptionInfoContainer) subscriptionInfoContainer.style.visibility = "visible";
  placeAuthActions();

  const userNameEl = document.getElementById("userName");
  if (userNameEl) {
    const p = authPayload?.profile;
    const u = authPayload?.user;
    userNameEl.textContent =
      p?.full_name ||
      u?.user_metadata?.full_name ||
      (u?.email ? u.email.split("@")[0] : "") ||
      u?.email ||
      "";
  }

  const adminNavLink = document.getElementById("adminNavLink");
  if (adminNavLink && authPayload?.profile?.role === "admin") {
    adminNavLink.classList.remove("hidden");
  }
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

  placeAuthActions();

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
  const logoutBtnHeader = document.getElementById("logoutBtnHeader");
  const logoutDialog = document.getElementById("logoutDialog");
  const logoutDialogBackdrop = document.getElementById("logoutDialogBackdrop");
  const logoutCancel = document.getElementById("logoutCancel");
  const logoutOk = document.getElementById("logoutOk");
  const handleLogoutIntent = (event) => {
    event.preventDefault();
    logoutDialog?.showModal?.();
  };
  logoutBtn?.addEventListener("click", handleLogoutIntent);
  logoutBtnHeader?.addEventListener("click", handleLogoutIntent);
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
  const userAvatar = document.getElementById("userAvatar");
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
    (authUser?.email ? authUser.email.split("@")[0] : "") ||
    authUser?.email ||
    "";

  if (userName) userName.textContent = displayName;
  if (userEmail) userEmail.textContent = authUser?.email || "panel@fondos.local";
  const userRoleBadge = document.getElementById("userRoleBadge");
  if (userRoleBadge && authProfile?.role) {
    userRoleBadge.textContent = authProfile.role === "admin" ? "Administrador" : "Usuario";
    userRoleBadge.className = `user-role-badge ${authProfile.role === "admin" ? "user-role-admin" : "user-role-user"}`;
  }
  const adminNavLink = document.getElementById("adminNavLink");
  if (adminNavLink && authProfile?.role === "admin") {
    adminNavLink.classList.remove("hidden");
  }
  if (userAvatar) {
    const avatarUrl = authProfile?.avatar_url || authUser?.user_metadata?.avatar_url || "";
    userAvatar.classList.toggle("hidden", !avatarUrl);
    if (avatarUrl) userAvatar.src = avatarUrl;
    else userAvatar.removeAttribute("src");
  }
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

  const userDropdownToggle = document.getElementById("userDropdownToggle");
  const dropdownMenu = document.getElementById("dropdownMenu");
  userDropdownToggle?.addEventListener("click", () => {
    dropdownMenu?.classList.toggle("hidden");
  });
  document.addEventListener("click", (event) => {
    if (!dropdownMenu || !userDropdownToggle) return;
    if (dropdownMenu.contains(event.target) || userDropdownToggle.contains(event.target)) return;
    dropdownMenu.classList.add("hidden");
  });
}

function paintStats(rows) {
  countStat.textContent = rows.length;
  if (!rows.length) {
    bestStat.textContent = "-";
    worstStat.textContent = "-";
    return;
  }
  const sorted = rows
    .filter((r) => typeof r.regularMarketChangePercent === "number")
    .sort((a, b) => b.regularMarketChangePercent - a.regularMarketChangePercent);
  if (!sorted.length) return;
  const best = sorted[0];
  const worst = sorted[sorted.length - 1];
  bestStat.textContent = `${best.symbol} (${formatNum(best.regularMarketChangePercent)}%)`;
  worstStat.textContent = `${worst.symbol} (${formatNum(worst.regularMarketChangePercent)}%)`;
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
    updateLoadMoreButton();
    return;
  }
  const sourceRows = allRows;
  if (!sourceRows.length) {
    emptyState.style.display = "block";
    emptyState.textContent = "No hay fondos para mostrar.";
    pageInfo.textContent = "Página 0/0";
    prevPageBtn.disabled = true;
    nextPageBtn.disabled = true;
    updateLoadMoreButton();
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
  updateLoadMoreButton();

  visibleRows.forEach((row, idx) => {
    const pct = row.regularMarketChangePercent;
    const symbol = (row.symbol || "").toUpperCase();
    const isFav = symbol && favoriteSymbols.has(symbol);
    const sparkline = buildSparklinePoints(row);
    const tile = document.createElement("article");
    tile.className = "heat-tile";
    tile.dataset.symbol = symbol;
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

function updateLoadMoreButton() {
  if (!loadMoreCategoryBtn) return;
  const categorySymbols = activeCategoryKey ? getCachedCategorySymbols(activeCategoryKey) : [];
  const hasMore = activeCategoryKey && activeCategoryOffset < categorySymbols.length;
  loadMoreCategoryBtn.hidden = !activeCategoryKey;
  loadMoreCategoryBtn.disabled = isCategoryLoading || !hasMore;
  loadMoreCategoryBtn.textContent = isCategoryLoading
    ? "Cargando..."
    : hasMore
      ? `Cargar más (${Math.min(CATEGORY_SYMBOL_LIMIT, categorySymbols.length - activeCategoryOffset)})`
      : "No hay más";
}

function normalizeSymbols(symbols) {
  return [
    ...new Set(
      symbols
        .map((symbol) => (typeof symbol === "string" ? symbol.trim().toUpperCase() : ""))
        .filter(Boolean)
    ),
  ];
}

function getCachedCategorySymbols(key) {
  return categorySymbolsCache[key] || [];
}

async function getCategorySymbols(key) {
  if (categorySymbolsCache[key]?.length) return categorySymbolsCache[key];

  try {
    const url = `/api/discover?category=${encodeURIComponent(key)}&limit=${DISCOVER_LIMIT_PER_CATEGORY}`;
    const res = await fetch(url, { cache: "no-store" });
    const data = await res.json();
    if (!res.ok || data?.error) throw new Error(data?.error || `HTTP ${res.status}`);

    const discoveredSymbols = Array.isArray(data?.symbols) ? data.symbols : [];
    const symbols = normalizeSymbols(discoveredSymbols);
    if (symbols.length) {
      categorySymbolsCache[key] = symbols;
    } else {
      delete categorySymbolsCache[key];
    }
  } catch (_) {
    delete categorySymbolsCache[key];
  }

  return categorySymbolsCache[key] || [];
}

function rowIdentity(row) {
  const symbol = (row.symbol || "").toUpperCase();
  const source = (row.source || "").toUpperCase();
  return symbol && source ? `${symbol}:${source}` : symbol;
}

function renderRows(rows, options = {}) {
  if (options.append) {
    const previousPage = currentPage;
    const byRow = new Map(allRows.map((row) => [rowIdentity(row), row]));
    rows.forEach((row) => {
      const key = rowIdentity(row);
      if (key) byRow.set(key, row);
    });
    allRows = [...byRow.values()];
    if (options.goToNextPage) {
      const totalPages = Math.max(1, Math.ceil(allRows.length / PAGE_SIZE));
      currentPage = Math.min(previousPage + 1, totalPages);
    }
  } else {
    allRows = rows;
    currentPage = 1;
  }
  paintStats(allRows);
  renderHeatmap();
}

function chunkSymbols(symbols, size) {
  const chunks = [];
  for (let i = 0; i < symbols.length; i += size) {
    chunks.push(symbols.slice(i, i + size));
  }
  return chunks;
}

async function requestQuoteRows(symbols, provider, quoteRequestId) {
  const chunks = chunkSymbols(symbols, MAX_SYMBOLS_PER_BATCH);
  const mergedRows = [];
  const errors = [];

  for (const chunk of chunks) {
    const endpoint = `/api/quote?symbols=${encodeURIComponent(chunk.join(","))}&provider=${encodeURIComponent(provider)}`;
    const res = await fetch(endpoint, { cache: "no-store" });
    const data = await res.json();
    if (quoteRequestId !== activeQuoteRequestId) return { aborted: true, rows: [], errors };
    if (!res.ok || data?.error) {
      errors.push(data?.error || `HTTP ${res.status}`);
      continue;
    }
    const rows = Array.isArray(data?.rows) ? data.rows : [];
    mergedRows.push(...rows);
  }

  if (provider !== "auto") {
    const loadedSymbols = new Set(
      mergedRows.map((row) => (row.symbol || "").toUpperCase()).filter(Boolean)
    );
    const missingSymbols = symbols.filter((symbol) => !loadedSymbols.has(symbol.toUpperCase()));
    if (missingSymbols.length) {
      const fallbackEndpoint = `/api/quote?symbols=${encodeURIComponent(missingSymbols.join(","))}&provider=auto`;
      const fallbackRes = await fetch(fallbackEndpoint, { cache: "no-store" });
      const fallbackData = await fallbackRes.json();
      if (quoteRequestId !== activeQuoteRequestId) return { aborted: true, rows: [], errors };
      if (fallbackRes.ok && !fallbackData?.error && Array.isArray(fallbackData?.rows)) {
        const seenRows = new Set(mergedRows.map(rowIdentity).filter(Boolean));
        fallbackData.rows.forEach((row) => {
          const key = rowIdentity(row);
          if (!key || seenRows.has(key)) return;
          seenRows.add(key);
          mergedRows.push(row);
        });
      }
    }
  }

  if (!mergedRows.length && provider !== "auto") {
    return requestQuoteRows(symbols, "auto", quoteRequestId);
  }

  return { aborted: false, rows: mergedRows, errors };
}

async function fetchQuotes(symbols, forcedProvider = null, requestId = null, options = {}) {
  const quoteRequestId = requestId ?? ++activeQuoteRequestId;
  if (!symbols.length) {
    emptyState.style.display = "block";
    emptyState.textContent = "No hay tickers seleccionados.";
    renderRows([]);
    return false;
  }
  if (!forcedProvider) {
    emptyState.style.display = "block";
    emptyState.textContent = "Cargando cotizaciones...";
    if (!allRows.length) {
      pageInfo.textContent = "Página 0/0";
      prevPageBtn.disabled = true;
      nextPageBtn.disabled = true;
    }
  }
  saveSettings();
  try {
    if (loadBtn) {
      loadBtn.disabled = true;
      loadBtn.textContent = "Cargando...";
    }
    const provider = forcedProvider || options.provider || "auto";
    const {
      aborted,
      rows: mergedRows,
      errors,
    } = await requestQuoteRows(symbols, provider, quoteRequestId);
    if (aborted) return false;

    if (!mergedRows.length) {
      throw new Error(errors[0] || "Sin resultados para esos tickers.");
    }
    if (quoteRequestId !== activeQuoteRequestId) return false;
    const rowsToRender =
      typeof options.maxRows === "number" ? mergedRows.slice(0, options.maxRows) : mergedRows;
    renderRows(rowsToRender, options);
    updateLoadMoreButton();
    if (errors.length) {
      emptyState.style.display = "block";
      emptyState.textContent = `Carga parcial: algunas tandas fallaron por límite de API (${errors[0]}).`;
    }
    return true;
  } catch (err) {
    if (quoteRequestId !== activeQuoteRequestId) return false;
    emptyState.style.display = "block";
    emptyState.textContent = `No se pudo cargar la cotización: ${err.message}. Revisa que estés en http://localhost:3000 y prueba 'Fuente: Auto'.`;
    return false;
  } finally {
    if (loadBtn) {
      loadBtn.disabled = false;
      loadBtn.textContent = "Cargar cotizaciones";
    }
  }
}

async function loadCategoryResults(key, options = {}) {
  const quoteRequestId = ++activeQuoteRequestId;
  const append = Boolean(options.append);
  const categorySymbols = await getCategorySymbols(key);
  if (quoteRequestId !== activeQuoteRequestId || activeCategoryKey !== key) return false;
  let offset = append ? activeCategoryOffset : 0;
  const collectedRows = [];
  const seenRows = new Set((append ? allRows : []).map(rowIdentity).filter(Boolean));
  selectedSymbols = append ? [...selectedSymbols] : [];

  emptyState.style.display = "block";
  emptyState.textContent = "Cargando cotizaciones...";
  if (!append && !allRows.length) {
    pageInfo.textContent = "Página 0/0";
    prevPageBtn.disabled = true;
    nextPageBtn.disabled = true;
  }

  while (collectedRows.length < CATEGORY_RESULT_LIMIT && offset < categorySymbols.length) {
    const symbols = categorySymbols.slice(offset, offset + CATEGORY_SYMBOL_LIMIT);
    offset += symbols.length;
    selectedSymbols = [...new Set([...selectedSymbols, ...symbols])];

    const { aborted, rows, errors } = await requestQuoteRows(
      symbols,
      CATEGORY_PROVIDER,
      quoteRequestId
    );
    if (aborted || activeCategoryKey !== key) return false;

    rows.forEach((row) => {
      if (collectedRows.length >= CATEGORY_RESULT_LIMIT) return;
      const rowKey = rowIdentity(row);
      if (!rowKey || seenRows.has(rowKey)) return;
      seenRows.add(rowKey);
      collectedRows.push(row);
    });

    if (errors.length && !collectedRows.length && offset >= categorySymbols.length) {
      emptyState.style.display = "block";
      emptyState.textContent = `No se pudo cargar la cotización: ${errors[0]}.`;
    }
  }

  activeCategoryOffset = offset;
  if (!collectedRows.length) {
    updateLoadMoreButton();
    if (!allRows.length) {
      emptyState.style.display = "block";
      emptyState.textContent = "No hay cotizaciones disponibles para esta categoría.";
    }
    return false;
  }

  renderRows(collectedRows.slice(0, CATEGORY_RESULT_LIMIT), {
    append,
    goToNextPage: append,
  });
  updateLoadMoreButton();
  return true;
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
    const provider = "auto";
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
      item.style.cursor = "pointer";
      item.dataset.detailSymbol = row.symbol;
      item.dataset.detailName = row.name || "-";
      item.dataset.detailExchange = row.exchange || "-";
      item.dataset.detailSource = row.source || "-";
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
  activeCategoryKey = null;
  activeCategoryOffset = 0;
  isCategoryLoading = false;
  updateLoadMoreButton();
  const symbols = [...selectedSymbols];
  if (!symbols.length) {
    emptyState.style.display = "block";
    emptyState.textContent =
      "No hay tickers seleccionados. Haz click en una categoría o usa el buscador.";
    renderRows([]);
    return;
  }
  fetchQuotes(symbols);
}

loadBtn?.addEventListener("click", runFromInput);
searchBtn.addEventListener("click", searchTickers);
searchInput.addEventListener("keydown", (ev) => {
  if (ev.key === "Enter") searchTickers();
});

let searchDebounceTimer = null;
searchInput.addEventListener("input", () => {
  clearTimeout(searchDebounceTimer);
  const q = searchInput.value.trim();
  if (q.length < 2) {
    searchResults.style.display = "none";
    searchResults.innerHTML = "";
    return;
  }
  searchDebounceTimer = setTimeout(searchTickers, 400);
});
categoryNavButtons.forEach((btn) => {
  btn.addEventListener("click", async () => {
    const key = btn.dataset.categoryNav;
    activeCategoryKey = key;
    activeCategoryOffset = 0;
    isCategoryLoading = true;
    categoryNavButtons.forEach((b) => {
      b.classList.toggle("active", b.dataset.categoryNav === key);
    });
    updateLoadMoreButton();
    const loaded = await loadCategoryResults(key);
    if (activeCategoryKey !== key) return;
    isCategoryLoading = false;
    if (!loaded) {
      updateLoadMoreButton();
      return;
    }
    updateLoadMoreButton();
  });
});

loadMoreCategoryBtn?.addEventListener("click", async () => {
  if (!activeCategoryKey) return;
  const key = activeCategoryKey;
  const categorySymbols = getCachedCategorySymbols(activeCategoryKey);
  const offset = activeCategoryOffset;
  if (offset >= categorySymbols.length) {
    updateLoadMoreButton();
    return;
  }
  isCategoryLoading = true;
  updateLoadMoreButton();
  const loaded = await loadCategoryResults(key, { append: true });
  if (activeCategoryKey !== key) return;
  isCategoryLoading = false;
  if (!loaded && activeCategoryOffset === offset) updateLoadMoreButton();
  updateLoadMoreButton();
});

const detailModal = document.getElementById("detailModal");
const detailModalBackdrop = document.getElementById("detailModalBackdrop");
const detailClose = document.getElementById("detailClose");
const detailSymbolEl = document.getElementById("detailSymbol");
const detailExchangeEl = document.getElementById("detailExchange");
const detailNameEl = document.getElementById("detailName");
const detailPriceEl = document.getElementById("detailPrice");
const detailChangeEl = document.getElementById("detailChange");
const detailHighEl = document.getElementById("detailHigh");
const detailLowEl = document.getElementById("detailLow");
const detailSourceEl = document.getElementById("detailSource");
const detailAddBtn = document.getElementById("detailAddBtn");

async function openDetailModal(symbol, prefill = {}) {
  detailSymbolEl.textContent = symbol;
  detailExchangeEl.textContent = prefill.exchange || "—";
  detailNameEl.textContent = prefill.name || symbol;
  detailPriceEl.textContent = "Cargando...";
  detailChangeEl.textContent = "—";
  detailChangeEl.className = "";
  detailHighEl.textContent = "—";
  detailLowEl.textContent = "—";
  detailSourceEl.textContent = prefill.source ? `Fuente: ${prefill.source}` : "";
  detailAddBtn.dataset.symbol = symbol;
  detailModal.showModal();

  try {
    const res = await fetch(`/api/quote?symbols=${encodeURIComponent(symbol)}&provider=auto`, { cache: "no-store" });
    const data = await res.json();
    if (!res.ok) throw new Error(data?.error || `HTTP ${res.status}`);
    const row = data?.rows?.[0];
    if (!row) throw new Error("Sin datos de precio");

    if (row.fullExchangeName && row.fullExchangeName !== "-") detailExchangeEl.textContent = row.fullExchangeName;
    if (row.shortName && row.shortName !== "-") detailNameEl.textContent = row.shortName;

    const price = row.regularMarketPrice;
    detailPriceEl.textContent = price != null ? `${formatNum(price)} ${row.currency || ""}` : "—";

    const pct = row.regularMarketChangePercent;
    const chg = row.regularMarketChange;
    if (pct != null) {
      detailChangeEl.textContent = `${chg >= 0 ? "+" : ""}${formatNum(chg)} (${pct >= 0 ? "+" : ""}${formatNum(pct)}%)`;
      detailChangeEl.className = pct >= 0 ? "pos" : "neg";
    }

    detailHighEl.textContent = row.regularMarketDayHigh != null ? `${formatNum(row.regularMarketDayHigh)} ${row.currency || ""}` : "—";
    detailLowEl.textContent = row.regularMarketDayLow != null ? `${formatNum(row.regularMarketDayLow)} ${row.currency || ""}` : "—";
    detailSourceEl.textContent = `Fuente: ${row.source || "—"}`;
  } catch (err) {
    console.error("[modal]", err);
    if (detailPriceEl) detailPriceEl.textContent = "No disponible";
    if (detailSourceEl) detailSourceEl.textContent = prefill.source ? `Fuente: ${prefill.source}` : "";
  }
}

detailClose?.addEventListener("click", () => detailModal?.close());
detailModalBackdrop?.addEventListener("click", () => detailModal?.close());
detailAddBtn?.addEventListener("click", () => {
  const symbol = detailAddBtn.dataset.symbol;
  if (!symbol) return;
  activeCategoryKey = null;
  activeCategoryOffset = 0;
  isCategoryLoading = false;
  updateLoadMoreButton();
  const symbols = upsertSymbols([symbol]);
  fetchQuotes(symbols);
  detailModal.close();
});

const newsModal = document.getElementById("newsModal");
const newsModalBackdrop = document.getElementById("newsModalBackdrop");
const newsModalClose = document.getElementById("newsModalClose");
const newsModalSourceEl = document.getElementById("newsModalSource");
const newsModalTitleEl = document.getElementById("newsModalTitle");
const newsModalBodyEl = document.getElementById("newsModalBody");

newsModalClose?.addEventListener("click", () => newsModal?.close());
newsModalBackdrop?.addEventListener("click", () => newsModal?.close());

document.querySelector(".news-grid")?.addEventListener("click", (ev) => {
  const card = ev.target.closest(".news-card");
  if (!card) return;
  newsModalSourceEl.textContent = card.querySelector(".news-source")?.textContent || "";
  newsModalTitleEl.textContent = card.querySelector("h3")?.textContent || "";
  newsModalBodyEl.textContent = card.querySelector("p")?.textContent || "";
  newsModal.showModal();
});

searchResults.addEventListener("click", (ev) => {
  const addBtn = ev.target.closest("button[data-symbol]");
  if (addBtn) {
    activeCategoryKey = null;
    activeCategoryOffset = 0;
    isCategoryLoading = false;
    updateLoadMoreButton();
    const symbols = upsertSymbols([addBtn.dataset.symbol]);
    fetchQuotes(symbols);
    return;
  }
  const item = ev.target.closest("[data-detail-symbol]");
  if (!item) return;
  openDetailModal(item.dataset.detailSymbol, {
    name: item.dataset.detailName,
    exchange: item.dataset.detailExchange,
    source: item.dataset.detailSource,
  });
});

heatmapGrid.addEventListener("click", (ev) => {
  const btn = ev.target.closest("button[data-favorite-symbol]");
  if (btn) {
    const symbol = (btn.dataset.favoriteSymbol || "").toUpperCase();
    if (!symbol) return;
    if (favoriteSymbols.has(symbol)) {
      favoriteSymbols.delete(symbol);
    } else {
      favoriteSymbols.add(symbol);
    }
    saveSettings();
    renderHeatmap();
    return;
  }

  const tile = ev.target.closest(".heat-tile");
  const symbol = (tile?.dataset.symbol || "").toUpperCase();
  if (!symbol) return;
  openDetailModal(symbol);
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
adjustHeaderOffset();
loadDashboardChrome().then(() => refreshAuthStrip());
window.addEventListener("resize", () => {
  placeAuthActions();
  adjustHeaderOffset();
});
selectedSymbols = [];
if (window.location.protocol === "file:") {
  emptyState.style.display = "block";
  emptyState.textContent =
    "Estás abriendo el archivo local. Usa http://localhost:3000 para que funcionen las APIs.";
}
