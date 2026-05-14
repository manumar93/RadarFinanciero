const form = document.getElementById("loginForm");
const emailInput = document.getElementById("emailInput");
const passwordInput = document.getElementById("passwordInput");
const errorBox = document.getElementById("errorBox");
const successBox = document.getElementById("successBox");
const goHomeBtn = document.getElementById("goHomeBtn");
const submitBtn = form.querySelector('button[type="submit"]');

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

goHomeBtn.addEventListener("click", () => {
  window.location.href = "/index.html";
});

if (!window.FundRadarAuth) {
  showError("No se pudo cargar el cliente de autenticacion.");
}

window.FundRadarAuth?.fetchCurrentUser().then((authPayload) => {
  if (authPayload?.user) {
    window.location.replace("/index.html");
  }
});

function validateLogin() {
  const email = emailInput.value.trim();
  const password = passwordInput.value;

  if (!email) return "El email es obligatorio.";
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return "El email no tiene un formato válido.";
  if (!password) return "La contraseña es obligatoria.";
  if (password.length < 6) return "La contraseña debe tener al menos 6 caracteres.";

  return null;
}

form.addEventListener("submit", async (event) => {
  event.preventDefault();
  errorBox.style.display = "none";
  successBox.style.display = "none";

  const validationError = validateLogin();
  if (validationError) { showError(validationError); return; }

  if (!window.FundRadarAuth) {
    showError("No se pudo cargar el cliente de autenticacion.");
    return;
  }

  try {
    submitBtn.disabled = true;
    submitBtn.textContent = "Entrando...";
    const data = await window.FundRadarAuth.loginFromWeb({
      email: emailInput.value.trim(),
      password: passwordInput.value,
    });

    showSuccess("Sesion iniciada correctamente. Redirigiendo...");
    window.setTimeout(() => {
      if (data?.session?.access_token) {
        window.location.replace("/index.html");
        return;
      }
      window.location.replace("/index.html");
    }, 700);
  } catch (error) {
    showError(error.message || "No se pudo iniciar sesion");
  } finally {
    submitBtn.disabled = false;
    submitBtn.textContent = "Entrar";
  }
});
