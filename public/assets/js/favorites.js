const errorBox = document.getElementById("errorBox");
const successBox = document.getElementById("successBox");
const favoritesList = document.getElementById("favoritesList");
const searchFavorites = document.getElementById("searchFavorites");
const searchBtn = document.getElementById("searchBtn");
const searchResults = document.getElementById("searchResults");
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
const detailRemoveBtn = document.getElementById("detailRemoveBtn");

let allFavorites = [];

const CATEGORY_LABELS = {
  money: "Monetario",
  bonds: "Renta fija",
  mixed: "Mixto",
  equity: "Renta variable",
};

function showError(msg) {
  successBox.style.display = "none";
  errorBox.textContent = msg;
  errorBox.style.display = "block";
}

function showSuccess(msg) {
  errorBox.style.display = "none";
  successBox.textContent = msg;
  successBox.style.display = "block";
  setTimeout(() => { successBox.style.display = "none"; }, 3000);
}

function escapeHtml(str) {
  return String(str).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

function formatNum(value, digits = 2) {
  if (typeof value !== "number" || Number.isNaN(value)) return "-";
  return value.toLocaleString("es-ES", { minimumFractionDigits: digits, maximumFractionDigits: digits });
}

function renderFavorites(favorites) {
  if (!favorites.length) {
    favoritesList.innerHTML = '<p class="empty-state">Aún no tienes favoritos. Añade uno arriba.</p>';
    return;
  }
  favoritesList.innerHTML = favorites.map((f) => `
    <div class="item-card" style="cursor:pointer;" data-symbol="${escapeHtml(f.symbol)}" data-name="${escapeHtml(f.instrument_name || "")}" data-id="${f.id}">
      <span class="item-symbol">${escapeHtml(f.symbol)}</span>
      <span class="item-name">${escapeHtml(f.instrument_name || "—")}</span>
      ${f.category ? `<span class="badge">${CATEGORY_LABELS[f.category] || f.category}</span>` : ""}
      <button class="btn-danger" data-action="delete" data-id="${f.id}">Eliminar</button>
    </div>
  `).join("");
}

async function openDetailModal(symbol, name, favId) {
  detailSymbolEl.textContent = symbol;
  detailExchangeEl.textContent = "";
  detailNameEl.textContent = name || symbol;
  detailPriceEl.textContent = "Cargando...";
  detailChangeEl.textContent = "—";
  detailChangeEl.className = "";
  detailHighEl.textContent = "—";
  detailLowEl.textContent = "—";
  detailSourceEl.textContent = "";
  detailRemoveBtn.dataset.id = favId;
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
  } catch (_) {
    detailPriceEl.textContent = "No disponible";
  }
}

detailClose.addEventListener("click", () => detailModal.close());
detailModalBackdrop.addEventListener("click", () => detailModal.close());

detailRemoveBtn.addEventListener("click", async () => {
  const id = detailRemoveBtn.dataset.id;
  detailRemoveBtn.disabled = true;
  detailRemoveBtn.textContent = "Eliminando...";
  try {
    await window.FundRadarAuth.removeFavorite(id);
    detailModal.close();
    showSuccess("Favorito eliminado.");
    await loadFavorites();
  } catch (err) {
    showError(err.message || "No se pudo eliminar.");
    detailRemoveBtn.disabled = false;
    detailRemoveBtn.textContent = "Eliminar de favoritos";
  }
});

async function searchTickers() {
  const query = searchFavorites.value.trim();
  if (query.length < 2) {
    searchResults.style.display = "block";
    searchResults.innerHTML = `<div class="result-item"><span>Escribe al menos 2 caracteres.</span></div>`;
    return;
  }
  try {
    searchBtn.disabled = true;
    searchBtn.textContent = "Buscando...";
    const res = await fetch(`/api/search?q=${encodeURIComponent(query)}&provider=auto`, { cache: "no-store" });
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
          <strong>${escapeHtml(row.symbol)}</strong> — ${escapeHtml(row.name || "-")}
          <div class="result-meta">${escapeHtml(row.exchange || "-")} | ${escapeHtml(row.source || "-")}</div>
        </div>
        <button class="btn-add-fav" data-symbol="${escapeHtml(row.symbol)}" data-name="${escapeHtml(row.name || "")}" type="button">+ Favorito</button>
      `;
      searchResults.appendChild(item);
    });
  } catch (err) {
    searchResults.style.display = "block";
    searchResults.innerHTML = `<div class="result-item"><span>Error: ${err.message}</span></div>`;
  } finally {
    searchBtn.disabled = false;
    searchBtn.textContent = "Buscar";
  }
}

searchResults.addEventListener("click", async (e) => {
  const btn = e.target.closest(".btn-add-fav");
  if (!btn) return;
  const { symbol, name } = btn.dataset;
  btn.disabled = true;
  btn.textContent = "Añadiendo...";
  try {
    await window.FundRadarAuth.addFavorite({ symbol, instrument_name: name || null });
    btn.textContent = "✓ Añadido";
    showSuccess(`${symbol} añadido a favoritos.`);
    await loadFavorites();
  } catch (err) {
    showError(err.message || "No se pudo añadir.");
    btn.disabled = false;
    btn.textContent = "+ Favorito";
  }
});

searchBtn.addEventListener("click", searchTickers);
searchFavorites.addEventListener("keydown", (ev) => { if (ev.key === "Enter") searchTickers(); });

let searchDebounceTimer = null;
searchFavorites.addEventListener("input", () => {
  clearTimeout(searchDebounceTimer);
  if (searchFavorites.value.trim().length < 2) {
    searchResults.style.display = "none";
    searchResults.innerHTML = "";
    return;
  }
  searchDebounceTimer = setTimeout(searchTickers, 400);
});

document.addEventListener("click", (e) => {
  if (!searchResults.contains(e.target) && e.target !== searchFavorites && e.target !== searchBtn) {
    searchResults.style.display = "none";
  }
});

async function loadFavorites() {
  try {
    const data = await window.FundRadarAuth.fetchFavorites();
    allFavorites = data.favorites || [];
    renderFavorites(allFavorites);
  } catch (_) {
    favoritesList.innerHTML = '<p class="empty-state">No se pudieron cargar los favoritos.</p>';
  }
}

favoritesList.addEventListener("click", async (e) => {
  const deleteBtn = e.target.closest("[data-action='delete']");
  if (deleteBtn) {
    const { id } = deleteBtn.dataset;
    if (!confirm("¿Quitar este símbolo de favoritos?")) return;
    deleteBtn.disabled = true;
    try {
      await window.FundRadarAuth.removeFavorite(id);
      showSuccess("Favorito eliminado.");
      await loadFavorites();
    } catch (err) {
      showError(err.message || "No se pudo eliminar el favorito.");
      deleteBtn.disabled = false;
    }
    return;
  }

  const card = e.target.closest(".item-card");
  if (card) {
    openDetailModal(card.dataset.symbol, card.dataset.name, card.dataset.id);
  }
});

async function init() {
  if (!window.FundRadarAuth) { showError("Error interno de autenticación."); return; }
  const session = await window.FundRadarAuth.fetchCurrentUser();
  if (!session?.user) { window.location.replace("/login.html"); return; }
  await loadFavorites();
}

init().catch((e) => showError(e.message || "Error al cargar la página."));
