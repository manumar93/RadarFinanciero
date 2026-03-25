const {
  getCurrentUserProfile,
  loginUser,
  registerUser,
  sanitizeAuthUser,
} = require("../services/auth.service");
const { compactText } = require("../utils/text");

function validateRegisterPayload(body) {
  const email = compactText(body.email).toLowerCase();
  const password = String(body.password || "");
  const full_name = compactText(body.full_name);
  const avatar_url = compactText(body.avatar_url);
  const risk_profile = compactText(body.risk_profile);
  const preferred_currency = compactText(body.preferred_currency).toUpperCase();

  if (!email || !email.includes("@")) {
    return { error: "Email inválido" };
  }
  if (password.length < 6) {
    return { error: "La contraseña debe tener al menos 6 caracteres" };
  }
  if (!full_name) {
    return { error: "El nombre completo es obligatorio" };
  }
  if (risk_profile && !["conservador", "moderado", "agresivo"].includes(risk_profile)) {
    return { error: "risk_profile inválido" };
  }

  return {
    email,
    password,
    full_name,
    avatar_url: avatar_url || null,
    risk_profile: risk_profile || null,
    preferred_currency: preferred_currency || "EUR",
  };
}

function validateLoginPayload(body) {
  const email = compactText(body.email).toLowerCase();
  const password = String(body.password || "");

  if (!email || !email.includes("@")) {
    return { error: "Email inválido" };
  }
  if (!password) {
    return { error: "La contraseña es obligatoria" };
  }

  return { email, password };
}

async function register(req, res, next) {
  try {
    const parsed = validateRegisterPayload(req.body || {});
    if (parsed.error) {
      return res.status(400).json({ error: parsed.error });
    }

    const result = await registerUser(parsed);
    return res.status(201).json({
      message: "Usuario registrado correctamente",
      ...result,
    });
  } catch (error) {
    return next(error);
  }
}

async function login(req, res, next) {
  try {
    const parsed = validateLoginPayload(req.body || {});
    if (parsed.error) {
      return res.status(400).json({ error: parsed.error });
    }

    const result = await loginUser(parsed);
    return res.status(200).json({
      message: "Login correcto",
      ...result,
    });
  } catch (error) {
    return next(error);
  }
}

function logout(_req, res) {
  return res.status(200).json({
    message: "Logout correcto en backend. El cliente debe eliminar el token local.",
  });
}

async function me(req, res, next) {
  try {
    const profile = await getCurrentUserProfile(req.user.id);
    return res.status(200).json({
      user: sanitizeAuthUser(req.user),
      profile,
    });
  } catch (error) {
    return next(error);
  }
}

module.exports = {
  register,
  login,
  logout,
  me,
};
