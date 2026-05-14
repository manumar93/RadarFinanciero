const form = document.getElementById("registerForm");
const fullNameInput = document.getElementById("fullNameInput");
const emailInput = document.getElementById("emailInput");
const passwordInput = document.getElementById("passwordInput");
const confirmPasswordInput = document.getElementById("confirmPasswordInput");
const currencyInput = document.getElementById("currencyInput");
const riskProfileInput = document.getElementById("riskProfileInput");
const errorBox = document.getElementById("errorBox");
const successBox = document.getElementById("successBox");
const goLoginBtn = document.getElementById("goLoginBtn");
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

function validateRegister() {
  const fullName = fullNameInput.value.trim();
  const email = emailInput.value.trim();
  const password = passwordInput.value;
  const confirmPassword = confirmPasswordInput.value;
  const currency = currencyInput.value.trim().toUpperCase();

  if (!fullName) return "El nombre completo es obligatorio.";
  if (fullName.length < 2) return "El nombre debe tener al menos 2 caracteres.";
  if (!/^[\p{L}\s'-]+$/u.test(fullName)) return "El nombre solo puede contener letras y espacios.";

  if (!email) return "El email es obligatorio.";
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return "El email no tiene un formato válido.";

  if (!password) return "La contraseña es obligatoria.";
  if (password.length < 8) return "La contraseña debe tener al menos 8 caracteres.";
  if (!/[A-Za-z]/.test(password)) return "La contraseña debe contener al menos una letra.";
  if (!/[0-9]/.test(password)) return "La contraseña debe contener al menos un número.";

  if (!confirmPassword) return "Confirma tu contraseña.";
  if (password !== confirmPassword) return "Las contraseñas no coinciden.";

  if (!currency) return "La moneda preferida es obligatoria.";
  if (!/^[A-Z]{3}$/.test(currency)) return "La moneda debe ser un código de 3 letras (ej: EUR, USD).";

  return null;
}

goLoginBtn.addEventListener("click", () => {
  window.location.href = "/login.html";
});

window.FundRadarAuth.fetchCurrentUser().then((authPayload) => {
  if (authPayload?.user) {
    window.location.href = "/index.html";
  }
});

form.addEventListener("submit", async (event) => {
  event.preventDefault();
  errorBox.style.display = "none";
  successBox.style.display = "none";

  const validationError = validateRegister();
  if (validationError) { showError(validationError); return; }

  try {
    submitBtn.disabled = true;
    submitBtn.textContent = "Creando cuenta...";
    await window.FundRadarAuth.registerFromWeb({
      full_name: fullNameInput.value.trim(),
      email: emailInput.value.trim(),
      password: passwordInput.value,
      preferred_currency: currencyInput.value.trim().toUpperCase(),
      risk_profile: riskProfileInput.value,
    });

    showSuccess("Cuenta creada correctamente. Redirigiendo...");
    window.setTimeout(() => {
      window.location.href = "/index.html";
    }, 800);
  } catch (error) {
    showError(error.message || "No se pudo crear la cuenta");
  } finally {
    submitBtn.disabled = false;
    submitBtn.textContent = "Crear cuenta";
  }
});
