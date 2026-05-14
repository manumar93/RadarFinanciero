const express = require("express");
const { requireAuth, requireAdmin } = require("../middleware/auth.middleware");
const adminController = require("../controllers/admin.controller");

const router = express.Router();

router.get("/users", requireAuth, requireAdmin, adminController.listUsers);
router.put("/users/:id/role", requireAuth, requireAdmin, adminController.updateUserRole);

module.exports = router;
