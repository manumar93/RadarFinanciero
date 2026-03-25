const express = require("express");

const marketDataController = require("../controllers/market-data.controller");

const router = express.Router();

router.get("/quote", marketDataController.quote);
router.get("/search", marketDataController.search);
router.get("/discover", marketDataController.discover);

module.exports = router;
