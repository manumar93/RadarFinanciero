const { findProfileByUserId, upsertProfileByUserId } = require("./profile.repository");
const { compactText } = require("../utils/text");

function normalizeProfilePayload(input = {}) {
  const profile = {
    full_name: compactText(input.full_name) || null,
    avatar_url: compactText(input.avatar_url) || null,
    risk_profile: compactText(input.risk_profile) || null,
    preferred_currency: compactText(input.preferred_currency).toUpperCase() || null,
  };

  return profile;
}

function validateProfilePayload(input = {}) {
  const profile = normalizeProfilePayload(input);

  if (
    profile.risk_profile &&
    !["conservador", "moderado", "agresivo"].includes(profile.risk_profile)
  ) {
    return { error: "risk_profile inválido" };
  }

  if (profile.preferred_currency && !/^[A-Z]{3}$/.test(profile.preferred_currency)) {
    return { error: "preferred_currency debe ser un código de 3 letras" };
  }

  return { value: profile };
}

async function getProfileByUserId(userId) {
  return findProfileByUserId(userId);
}

async function upsertProfile(userId, input = {}) {
  const parsed = validateProfilePayload(input);
  if (parsed.error) {
    throw new Error(parsed.error);
  }

  return upsertProfileByUserId(userId, parsed.value);
}

module.exports = {
  getProfileByUserId,
  upsertProfile,
  validateProfilePayload,
};
