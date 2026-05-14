const {
  findFavoritesByUserId,
  findFavoriteByIdAndUserId,
  createFavorite,
  deleteFavorite,
} = require("../services/favorites.repository");

async function listFavorites(req, res, next) {
  try {
    const favorites = await findFavoritesByUserId(req.user.id);
    return res.status(200).json({ favorites });
  } catch (error) {
    return next(error);
  }
}

async function createFavoriteHandler(req, res, next) {
  try {
    const { symbol, instrument_name, category } = req.body || {};

    if (!symbol || typeof symbol !== "string" || !symbol.trim()) {
      return res.status(400).json({ error: "El campo 'symbol' es obligatorio" });
    }

    const validCategories = ["money", "bonds", "mixed", "equity"];
    if (category && !validCategories.includes(category)) {
      return res.status(400).json({ error: `'category' debe ser uno de: ${validCategories.join(", ")}` });
    }

    const favorite = await createFavorite(req.user.id, {
      symbol: symbol.trim().toUpperCase(),
      instrument_name: instrument_name?.trim() || null,
      category: category || null,
    });

    return res.status(201).json({ message: "Favorito añadido correctamente", favorite });
  } catch (error) {
    if (error.statusCode === 409) {
      return res.status(409).json({ error: error.message });
    }
    return next(error);
  }
}

async function deleteFavoriteHandler(req, res, next) {
  try {
    const { id } = req.params;

    const existing = await findFavoriteByIdAndUserId(id, req.user.id);
    if (!existing) {
      return res.status(404).json({ error: "Favorito no encontrado" });
    }

    await deleteFavorite(id, req.user.id);
    return res.status(200).json({ message: "Favorito eliminado correctamente" });
  } catch (error) {
    return next(error);
  }
}

module.exports = {
  listFavorites,
  createFavoriteHandler,
  deleteFavoriteHandler,
};
