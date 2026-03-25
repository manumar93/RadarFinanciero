const { getSupabaseAnonClient } = require("../config/supabase");
const { getProfileByUserId, upsertProfile } = require("./profile.service");
const { compactText } = require("../utils/text");

function sanitizeAuthUser(user) {
  return {
    id: user.id,
    email: user.email || "",
    email_confirmed_at: user.email_confirmed_at || null,
    created_at: user.created_at || null,
    user_metadata: user.user_metadata || {},
  };
}

async function ensureProfileExists(user, profileInput = {}) {
  const fullName =
    compactText(profileInput.full_name) || compactText(user.user_metadata?.full_name) || null;
  await upsertProfile(user.id, {
    full_name: fullName,
    avatar_url: profileInput.avatar_url,
    risk_profile: profileInput.risk_profile,
    preferred_currency: profileInput.preferred_currency || "EUR",
  });
}

async function registerUser({
  email,
  password,
  full_name,
  avatar_url,
  risk_profile,
  preferred_currency,
}) {
  const supabaseAnon = getSupabaseAnonClient();

  const normalizedEmail = compactText(email).toLowerCase();
  const fullName = compactText(full_name);

  const { data, error } = await supabaseAnon.auth.signUp({
    email: normalizedEmail,
    password,
    options: {
      data: {
        full_name: fullName || null,
      },
    },
  });

  if (error) {
    throw new Error(error.message);
  }

  const user = data?.user;
  if (!user) {
    throw new Error("No se pudo crear el usuario");
  }

  await ensureProfileExists(user, {
    full_name,
    avatar_url,
    risk_profile,
    preferred_currency,
  });

  // Intenta recuperar el perfil recién creado para devolverlo consistente.
  return {
    user: sanitizeAuthUser(user),
    session: data.session || null,
    profile: await getProfileByUserId(user.id),
  };
}

async function loginUser({ email, password }) {
  const supabaseAnon = getSupabaseAnonClient();
  const normalizedEmail = compactText(email).toLowerCase();

  const { data, error } = await supabaseAnon.auth.signInWithPassword({
    email: normalizedEmail,
    password,
  });

  if (error) {
    throw new Error(error.message);
  }

  return {
    user: sanitizeAuthUser(data.user),
    session: data.session,
  };
}

async function getCurrentUserProfile(userId) {
  return getProfileByUserId(userId);
}

module.exports = {
  registerUser,
  loginUser,
  getCurrentUserProfile,
  sanitizeAuthUser,
};
