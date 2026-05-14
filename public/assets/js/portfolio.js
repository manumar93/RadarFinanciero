const errorBox = document.getElementById("errorBox");
const successBox = document.getElementById("successBox");
const portfolioList = document.getElementById("portfolioList");
const createBtn = document.getElementById("createBtn");
const newName = document.getElementById("newName");
const newDesc = document.getElementById("newDesc");
const editDialog = document.getElementById("editDialog");
const editBackdrop = document.getElementById("editBackdrop");
const editId = document.getElementById("editId");
const editName = document.getElementById("editName");
const editDesc = document.getElementById("editDesc");
const editCancel = document.getElementById("editCancel");
const editSave = document.getElementById("editSave");

const portfolioModal = document.getElementById("portfolioModal");
const portfolioModalBackdrop = document.getElementById("portfolioModalBackdrop");
const pmClose = document.getElementById("pmClose");
const pmName = document.getElementById("pmName");
const pmDesc = document.getElementById("pmDesc");
const pmSearchInput = document.getElementById("pmSearchInput");
const pmSearchBtn = document.getElementById("pmSearchBtn");
const pmSearchResults = document.getElementById("pmSearchResults");
const pmItemsList = document.getElementById("pmItemsList");

const addItemDialog = document.getElementById("addItemDialog");
const addItemBackdrop = document.getElementById("addItemBackdrop");
const addItemTitle = document.getElementById("addItemTitle");
const addItemSymbolVal = document.getElementById("addItemSymbolVal");
const addItemNameVal = document.getElementById("addItemNameVal");
const addItemUnits = document.getElementById("addItemUnits");
const addItemCost = document.getElementById("addItemCost");
const addItemCategory = document.getElementById("addItemCategory");
const addItemCancel = document.getElementById("addItemCancel");
const addItemSave = document.getElementById("addItemSave");

let currentPortfolioId = null;
let pmSearchDebounce = null;

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

function categoryLabel(cat) {
  const map = { money: "Monetario", bonds: "Renta fija", mixed: "Mixto", equity: "Renta variable" };
  return map[cat] || cat;
}

function formatNum(value, digits = 2) {
  if (typeof value !== "number" || Number.isNaN(value)) return "-";
  return value.toLocaleString("es-ES", { minimumFractionDigits: digits, maximumFractionDigits: digits });
}

function escapeHtml(str) {
  return String(str).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

function escapeAttr(str) {
  return String(str).replace(/"/g, "&quot;");
}

function renderPortfolios(portfolios) {
  if (!portfolios.length) {
    portfolioList.innerHTML = '<p class="empty-state">Aún no tienes carteras. Crea una arriba.</p>';
    return;
  }

  portfolioList.innerHTML = portfolios.map((p) => `
    <div class="item-card" data-id="${p.id}">
      <div class="item-info">
        <p class="item-name">${escapeHtml(p.name)}</p>
        ${p.description ? `<p class="item-desc">${escapeHtml(p.description)}</p>` : ""}
      </div>
      <div class="item-actions">
        <button class="btn-primary btn-icon" data-action="open" data-id="${p.id}" data-name="${escapeAttr(p.name)}" data-desc="${escapeAttr(p.description || "")}">Ver fondos</button>
        <button class="btn-secondary btn-icon" data-action="edit" data-id="${p.id}" data-name="${escapeAttr(p.name)}" data-desc="${escapeAttr(p.description || "")}">Editar</button>
        <button class="btn-danger btn-icon" data-action="delete" data-id="${p.id}">Eliminar</button>
      </div>
    </div>
  `).join("");
}

async function loadPortfolios() {
  try {
    const data = await window.FundRadarAuth.fetchPortfolios();
    renderPortfolios(data.portfolios || []);
  } catch (_) {
    portfolioList.innerHTML = '<p class="empty-state">No se pudieron cargar las carteras.</p>';
  }
}

// ── Portfolio detail modal ──

async function openPortfolioModal(portfolioId, name, desc) {
  currentPortfolioId = portfolioId;
  pmName.textContent = name;
  pmDesc.textContent = desc || "";
  pmDesc.style.display = desc ? "block" : "none";
  pmSearchInput.value = "";
  pmSearchResults.style.display = "none";
  pmSearchResults.innerHTML = "";
  pmItemsList.innerHTML = '<p class="empty-state">Cargando…</p>';
  portfolioModal.showModal();
  await loadPortfolioItems(portfolioId);
}

async function loadPortfolioItems(portfolioId) {
  try {
    const data = await window.FundRadarAuth.fetchPortfolioItems(portfolioId);
    renderPortfolioItems(data.items || []);
  } catch (_) {
    pmItemsList.innerHTML = '<p class="empty-state">No se pudieron cargar los instrumentos.</p>';
  }
}

function renderPortfolioItems(items) {
  if (!items.length) {
    pmItemsList.innerHTML = '<p class="empty-state">Esta cartera no tiene instrumentos todavía. Usa el buscador para añadir.</p>';
    return;
  }
  pmItemsList.innerHTML = items.map((item) => `
    <div class="pm-item">
      <span class="pm-symbol">${escapeHtml(item.symbol)}</span>
      <span class="pm-name">${escapeHtml(item.instrument_name || "—")}</span>
      ${item.category ? `<span class="badge badge-category">${categoryLabel(item.category)}</span>` : ""}
      ${item.units != null ? `<span class="pm-meta">${formatNum(item.units, 4)} part.</span>` : ""}
      ${item.average_cost != null ? `<span class="pm-meta">Coste medio: ${formatNum(item.average_cost)}</span>` : ""}
      <button class="btn-danger btn-icon" data-action="remove-item" data-item-id="${item.id}">Eliminar</button>
    </div>
  `).join("");
}

pmClose.addEventListener("click", () => portfolioModal.close());
portfolioModalBackdrop.addEventListener("click", () => portfolioModal.close());

// ── Search within modal ──

async function pmSearch() {
  const q = pmSearchInput.value.trim();
  if (q.length < 2) {
    pmSearchResults.style.display = "block";
    pmSearchResults.innerHTML = `<div class="result-item"><span>Escribe al menos 2 caracteres.</span></div>`;
    return;
  }
  try {
    pmSearchBtn.disabled = true;
    pmSearchBtn.textContent = "Buscando...";
    const res = await fetch(`/api/search?q=${encodeURIComponent(q)}&provider=auto`, { cache: "no-store" });
    const data = await res.json();
    if (!res.ok || data?.error) throw new Error(data?.error || `HTTP ${res.status}`);
    const rows = Array.isArray(data?.rows) ? data.rows : [];
    pmSearchResults.style.display = "block";
    if (!rows.length) {
      pmSearchResults.innerHTML = `<div class="result-item"><span>Sin resultados</span></div>`;
      return;
    }
    pmSearchResults.innerHTML = "";
    rows.forEach((row) => {
      const item = document.createElement("div");
      item.className = "result-item";
      item.innerHTML = `
        <div>
          <strong>${escapeHtml(row.symbol)}</strong> — ${escapeHtml(row.name || "-")}
          <div class="result-meta">${escapeHtml(row.exchange || "-")} | ${escapeHtml(row.source || "-")}</div>
        </div>
        <button class="btn-add-item" data-symbol="${escapeHtml(row.symbol)}" data-name="${escapeHtml(row.name || "")}" type="button">+ Añadir</button>
      `;
      pmSearchResults.appendChild(item);
    });
  } catch (err) {
    pmSearchResults.style.display = "block";
    pmSearchResults.innerHTML = `<div class="result-item"><span>Error: ${err.message}</span></div>`;
  } finally {
    pmSearchBtn.disabled = false;
    pmSearchBtn.textContent = "Buscar";
  }
}

pmSearchBtn.addEventListener("click", pmSearch);
pmSearchInput.addEventListener("keydown", (e) => { if (e.key === "Enter") pmSearch(); });
pmSearchInput.addEventListener("input", () => {
  clearTimeout(pmSearchDebounce);
  if (pmSearchInput.value.trim().length < 2) {
    pmSearchResults.style.display = "none";
    pmSearchResults.innerHTML = "";
    return;
  }
  pmSearchDebounce = setTimeout(pmSearch, 400);
});

document.addEventListener("click", (e) => {
  if (
    portfolioModal.open &&
    !pmSearchResults.contains(e.target) &&
    e.target !== pmSearchInput &&
    e.target !== pmSearchBtn
  ) {
    pmSearchResults.style.display = "none";
  }
});

// ── Add item dialog ──

pmSearchResults.addEventListener("click", (e) => {
  const btn = e.target.closest(".btn-add-item");
  if (!btn) return;
  const { symbol, name } = btn.dataset;
  addItemTitle.textContent = `Añadir ${symbol}`;
  addItemSymbolVal.value = symbol;
  addItemNameVal.value = name;
  addItemUnits.value = "";
  addItemCost.value = "";
  addItemCategory.value = "";
  addItemDialog.showModal();
});

addItemCancel.addEventListener("click", () => addItemDialog.close());
addItemBackdrop.addEventListener("click", () => addItemDialog.close());

addItemSave.addEventListener("click", async () => {
  const symbol = addItemSymbolVal.value;
  const unitsRaw = addItemUnits.value.trim();
  const unitsNum = unitsRaw === "" ? 0 : parseFloat(unitsRaw);
  if (Number.isNaN(unitsNum) || unitsNum < 0) {
    alert("Introduce un número válido de participaciones (mínimo 0).");
    return;
  }

  addItemSave.disabled = true;
  addItemSave.textContent = "Añadiendo...";
  try {
    await window.FundRadarAuth.addPortfolioItem(currentPortfolioId, {
      symbol,
      instrument_name: addItemNameVal.value || null,
      category: addItemCategory.value || null,
      units: unitsNum,
      average_cost: addItemCost.value.trim() !== "" ? parseFloat(addItemCost.value) : null,
    });
    addItemDialog.close();
    pmSearchResults.style.display = "none";
    pmSearchInput.value = "";
    showSuccess(`${symbol} añadido a la cartera.`);
    await loadPortfolioItems(currentPortfolioId);
  } catch (err) {
    alert(err.message || "No se pudo añadir el instrumento.");
  } finally {
    addItemSave.disabled = false;
    addItemSave.textContent = "Añadir a la cartera";
  }
});

// ── Remove item from modal list ──

pmItemsList.addEventListener("click", async (e) => {
  const btn = e.target.closest("[data-action='remove-item']");
  if (!btn) return;
  const { itemId } = btn.dataset;
  if (!confirm("¿Eliminar este instrumento de la cartera?")) return;
  btn.disabled = true;
  try {
    await window.FundRadarAuth.removePortfolioItem(currentPortfolioId, itemId);
    showSuccess("Instrumento eliminado.");
    await loadPortfolioItems(currentPortfolioId);
  } catch (err) {
    showError(err.message || "No se pudo eliminar.");
    btn.disabled = false;
  }
});

// ── Portfolio list interactions ──

createBtn.addEventListener("click", async () => {
  const name = newName.value.trim();
  if (!name) { showError("El nombre es obligatorio."); return; }

  createBtn.disabled = true;
  createBtn.textContent = "Creando...";
  errorBox.style.display = "none";

  try {
    await window.FundRadarAuth.createPortfolio({
      name,
      description: newDesc.value.trim() || null,
    });
    newName.value = "";
    newDesc.value = "";
    showSuccess("Cartera creada correctamente.");
    await loadPortfolios();
  } catch (e) {
    showError(e.message || "No se pudo crear la cartera.");
  } finally {
    createBtn.disabled = false;
    createBtn.textContent = "Crear cartera";
  }
});

portfolioList.addEventListener("click", async (e) => {
  const btn = e.target.closest("[data-action]");
  if (!btn) return;

  const { action, id } = btn.dataset;

  if (action === "open") {
    openPortfolioModal(id, btn.dataset.name, btn.dataset.desc);
  }

  if (action === "edit") {
    editId.value = id;
    editName.value = btn.dataset.name;
    editDesc.value = btn.dataset.desc;
    editDialog.showModal();
  }

  if (action === "delete") {
    if (!confirm("¿Eliminar esta cartera? Se perderán todas sus posiciones.")) return;
    btn.disabled = true;
    try {
      await window.FundRadarAuth.deletePortfolio(id);
      showSuccess("Cartera eliminada.");
      await loadPortfolios();
    } catch (e) {
      showError(e.message || "No se pudo eliminar la cartera.");
      btn.disabled = false;
    }
  }
});

editCancel.addEventListener("click", () => editDialog.close());
editBackdrop.addEventListener("click", () => editDialog.close());

editSave.addEventListener("click", async () => {
  const name = editName.value.trim();
  if (!name) { alert("El nombre es obligatorio."); return; }

  editSave.disabled = true;
  editSave.textContent = "Guardando...";

  try {
    await window.FundRadarAuth.updatePortfolio(editId.value, {
      name,
      description: editDesc.value.trim() || null,
    });
    editDialog.close();
    showSuccess("Cartera actualizada.");
    await loadPortfolios();
  } catch (e) {
    alert(e.message || "No se pudo actualizar la cartera.");
  } finally {
    editSave.disabled = false;
    editSave.textContent = "Guardar cambios";
  }
});

async function init() {
  if (!window.FundRadarAuth) { showError("Error interno de autenticación."); return; }
  const session = await window.FundRadarAuth.fetchCurrentUser();
  if (!session?.user) { window.location.replace("/login.html"); return; }
  await loadPortfolios();
}

init().catch((e) => showError(e.message || "Error al cargar la página."));
