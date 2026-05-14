const express = require("express");

const favoritesController = require("../controllers/favorites.controller");
const { requireAuth } = require("../middleware/auth.middleware");

const router = express.Router();

router.get("/", requireAuth, favoritesController.listFavorites);
router.post("/", requireAuth, favoritesController.createFavoriteHandler);
router.delete("/:id", requireAuth, favoritesController.deleteFavoriteHandler);

module.exports = router;
