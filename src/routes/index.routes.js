const express = require("express");

const apiRouter = require("./api.routes");
const authRouter = require("./auth.routes");
const healthRouter = require("./health.routes");
const profileRouter = require("./profile.routes");

const router = express.Router();

router.use("/health", healthRouter);
router.use("/api/auth", authRouter);
router.use("/api/profile", profileRouter);
router.use("/api", apiRouter);

module.exports = router;
