const {
  getProfileByUserId,
  upsertProfile,
  validateProfilePayload,
} = require("../services/profile.service");

async function getProfile(req, res, next) {
  try {
    const profile = await getProfileByUserId(req.user.id);
    return res.status(200).json({ profile });
  } catch (error) {
    return next(error);
  }
}

async function updateProfile(req, res, next) {
  try {
    const parsed = validateProfilePayload(req.body || {});
    if (parsed.error) {
      return res.status(400).json({ error: parsed.error });
    }

    const profile = await upsertProfile(req.user.id, parsed.value);
    return res.status(200).json({
      message: "Perfil actualizado correctamente",
      profile,
    });
  } catch (error) {
    return next(error);
  }
}

module.exports = {
  getProfile,
  updateProfile,
};
