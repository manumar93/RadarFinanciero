const form = document.getElementById("profileForm");
const emailBox = document.getElementById("emailBox");
const fullNameInput = document.getElementById("fullNameInput");
const avatarUrlInput = document.getElementById("avatarUrlInput");
const currencyInput = document.getElementById("currencyInput");
const riskProfileInput = document.getElementById("riskProfileInput");
const updatedAtBox = document.getElementById("updatedAtBox");
const errorBox = document.getElementById("errorBox");
const successBox = document.getElementById("successBox");
const saveBtn = document.getElementById("saveBtn");

function showError(message) {
  successBox.style.display = "none";
  errorBox.textContent = message;
  errorBox.style.display = "block";
}

function showSuccess(message) {
  errorBox.style.display = "none";
  successBox.textContent = message;
  successBox.style.display = "block";
}

function formatDate(value) {
  if (!value) return "Sin datos";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Sin datos";
  return date.toLocaleString("es-ES");
}

function fillProfile(authPayload, profile) {
  emailBox.textContent = authPayload?.user?.email || "Sin email";
  fullNameInput.value = profile?.full_name || "";
  avatarUrlInput.value = profile?.avatar_url || "";
  currencyInput.value = profile?.preferred_currency || "EUR";
  riskProfileInput.value = profile?.risk_profile || "";
  updatedAtBox.textContent = formatDate(profile?.updated_at);
}

async function loadProfilePage() {
  if (!window.FundRadarAuth) {
    showError("No se pudo cargar el cliente de autenticacion.");
    return;
  }

  const authPayload = await window.FundRadarAuth.fetchCurrentUser();
  if (!authPayload?.user) {
    window.location.replace("/login.html");
    return;
  }

  const profileResponse = await window.FundRadarAuth.fetchProfile();
  fillProfile(authPayload, profileResponse?.profile || null);
}

form.addEventListener("submit", async (event) => {
  event.preventDefault();
  errorBox.style.display = "none";
  successBox.style.display = "none";

  try {
    saveBtn.disabled = true;
    saveBtn.textContent = "Guardando...";

    const result = await window.FundRadarAuth.updateProfile({
      full_name: fullNameInput.value,
      avatar_url: avatarUrlInput.value,
      preferred_currency: currencyInput.value,
      risk_profile: riskProfileInput.value,
    });

    fillProfile(await window.FundRadarAuth.fetchCurrentUser(), result?.profile || null);
    showSuccess("Perfil actualizado correctamente.");
  } catch (error) {
    showError(error.message || "No se pudo actualizar el perfil.");
  } finally {
    saveBtn.disabled = false;
    saveBtn.textContent = "Guardar cambios";
  }
});

loadProfilePage().catch((error) => {
  showError(error.message || "No se pudo cargar el perfil.");
});
