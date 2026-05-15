const { getSupabaseAdminClient } = require("../config/supabase");
const { PROFILE_ROLES, getProfileByUserId } = require("../services/profile.service");

function getBearerToken(req) {
  const header = req.headers.authorization || "";
  if (!header.startsWith("Bearer ")) return null;
  return header.slice("Bearer ".length).trim();
}

async function requireAuth(req, res, next) {
  try {
    const accessToken = getBearerToken(req);
    if (!accessToken) {
      return res.status(401).json({ error: "Falta token de autenticación" });
    }

    const supabaseAdmin = getSupabaseAdminClient();
    const { data, error } = await supabaseAdmin.auth.getUser(accessToken);

    if (error || !data?.user) {
      return res.status(401).json({ error: "Token inválido o expirado" });
    }

    req.accessToken = accessToken;
    req.user = data.user;
    return next();
  } catch (error) {
    return next(error);
  }
}

async function requireAdmin(req, res, next) {
  try {
    if (!req.user?.id) {
      return res.status(401).json({ error: "Autenticación requerida" });
    }

    const profile = req.profile || (await getProfileByUserId(req.user.id));
    if (profile?.role !== PROFILE_ROLES.ADMIN) {
      return res.status(403).json({ error: "Permisos de administrador requeridos" });
    }

    req.profile = profile;
    return next();
  } catch (error) {
    return next(error);
  }
}

module.exports = {
  requireAdmin,
  requireAuth,
};
