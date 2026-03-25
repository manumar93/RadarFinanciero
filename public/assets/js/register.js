const form = document.getElementById("registerForm");
const fullNameInput = document.getElementById("fullNameInput");
const emailInput = document.getElementById("emailInput");
const passwordInput = document.getElementById("passwordInput");
const currencyInput = document.getElementById("currencyInput");
const riskProfileInput = document.getElementById("riskProfileInput");
const errorBox = document.getElementById("errorBox");
const successBox = document.getElementById("successBox");
const goLoginBtn = document.getElementById("goLoginBtn");

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

  try {
    await window.FundRadarAuth.registerFromWeb({
      full_name: fullNameInput.value,
      email: emailInput.value,
      password: passwordInput.value,
      preferred_currency: currencyInput.value,
      risk_profile: riskProfileInput.value,
    });

    showSuccess("Cuenta creada correctamente. Redirigiendo...");
    window.setTimeout(() => {
      window.location.href = "/index.html";
    }, 800);
  } catch (error) {
    showError(error.message || "No se pudo crear la cuenta");
  }
});
