const express = require("express");

const apiRouter = require("./api.routes");
const authRouter = require("./auth.routes");
const adminRouter = require("./admin.routes");
const healthRouter = require("./health.routes");
const profileRouter = require("./profile.routes");
const portfolioRouter = require("./portfolio.routes");
const favoritesRouter = require("./favorites.routes");

const router = express.Router();

router.use("/health", healthRouter);
router.use("/api/auth", authRouter);
router.use("/api/admin", adminRouter);
router.use("/api/profile", profileRouter);
router.use("/api/portfolios", portfolioRouter);
router.use("/api/favorites", favoritesRouter);
router.use("/api", apiRouter);

module.exports = router;
