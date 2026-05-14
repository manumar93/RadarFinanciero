const tbody = document.getElementById("usersTableBody");
const errorBox = document.getElementById("adminError");

let currentUserId = null;

function formatDate(iso) {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("es-ES", { day: "2-digit", month: "short", year: "numeric" });
}

function shortId(id) {
  return id ? `${id.slice(0, 8)}…` : "—";
}

async function changeRole(userId, newRole, btn) {
  const label = newRole === "admin" ? "hacer Admin" : "quitar Admin";
  if (!confirm(`¿Seguro que quieres ${label} a este usuario?`)) return;

  btn.disabled = true;
  const token = window.FundRadarAuth.getAccessToken();

  try {
    const res = await fetch(`/api/admin/users/${userId}/role`, {
      method: "PUT",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ role: newRole }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data?.error || `HTTP ${res.status}`);
    await loadUsers();
  } catch (err) {
    errorBox.textContent = err.message || "No se pudo cambiar el rol.";
    errorBox.style.display = "block";
    btn.disabled = false;
  }
}

function renderRows(users) {
  if (!users.length) {
    tbody.innerHTML = '<tr><td colspan="7" style="padding:24px 14px;color:#93a8bb;">Sin usuarios registrados.</td></tr>';
    return;
  }
  tbody.innerHTML = users.map((u) => {
    const isSelf = u.id === currentUserId;
    const isAdmin = u.role === "admin";
    const actionBtn = isSelf
      ? '<span style="color:#93a8bb;font-size:0.8rem;">Tu cuenta</span>'
      : isAdmin
        ? `<button class="btn-role btn-make-user" data-id="${u.id}" data-role="user">Quitar Admin</button>`
        : `<button class="btn-role btn-make-admin" data-id="${u.id}" data-role="admin">Hacer Admin</button>`;

    return `
      <tr>
        <td class="col-id" title="${u.id}" style="font-family:monospace;font-size:0.82rem;color:#93a8bb;">${shortId(u.id)}</td>
        <td>${u.full_name || '<span style="color:#93a8bb;">Sin nombre</span>'}</td>
        <td><span class="badge-${u.role}">${isAdmin ? "Admin" : "Usuario"}</span></td>
        <td>${u.risk_profile || '<span style="color:#93a8bb;">—</span>'}</td>
        <td class="col-currency">${u.preferred_currency || "—"}</td>
        <td style="color:#93a8bb;">${formatDate(u.created_at)}</td>
        <td>${actionBtn}</td>
      </tr>
    `;
  }).join("");

  tbody.querySelectorAll(".btn-role[data-id]").forEach((btn) => {
    btn.addEventListener("click", () => changeRole(btn.dataset.id, btn.dataset.role, btn));
  });
}

async function loadUsers() {
  errorBox.style.display = "none";
  const token = window.FundRadarAuth.getAccessToken();
  const res = await fetch("/api/admin/users", {
    headers: { Authorization: `Bearer ${token}` },
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data?.error || `HTTP ${res.status}`);
  renderRows(data.users || []);
}

async function loadAdminPage() {
  if (!window.FundRadarAuth) {
    errorBox.textContent = "No se pudo cargar el cliente de autenticacion.";
    errorBox.style.display = "block";
    return;
  }

  const authPayload = await window.FundRadarAuth.fetchCurrentUser();
  if (!authPayload?.user) {
    window.location.replace("/login.html");
    return;
  }

  const profileRes = await window.FundRadarAuth.fetchProfile();
  if (profileRes?.profile?.role !== "admin") {
    window.location.replace("/index.html");
    return;
  }

  currentUserId = authPayload.user.id;

  try {
    await loadUsers();
  } catch (err) {
    errorBox.textContent = err.message || "No se pudieron cargar los usuarios.";
    errorBox.style.display = "block";
    tbody.innerHTML = "";
  }
}

loadAdminPage();
