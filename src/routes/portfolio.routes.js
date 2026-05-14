const express = require("express");

const portfolioController = require("../controllers/portfolio.controller");
const { requireAuth } = require("../middleware/auth.middleware");

const router = express.Router();

router.get("/", requireAuth, portfolioController.listPortfolios);
router.post("/", requireAuth, portfolioController.createPortfolioHandler);
router.put("/:id", requireAuth, portfolioController.updatePortfolioHandler);
router.delete("/:id", requireAuth, portfolioController.deletePortfolioHandler);

router.get("/:id/items", requireAuth, portfolioController.listItemsHandler);
router.post("/:id/items", requireAuth, portfolioController.addItemHandler);
router.delete("/:id/items/:itemId", requireAuth, portfolioController.removeItemHandler);

module.exports = router;
