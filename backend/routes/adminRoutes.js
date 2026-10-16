const express = require("express");
const router = express.Router();
const { getAllItemsAdmin, getAdminStats } = require("../controllers/adminController");
const { protect, requireRole } = require("../middleware/auth");

router.get("/items", protect, requireRole("admin", "security"), getAllItemsAdmin);
router.get("/stats", protect, requireRole("admin", "security"), getAdminStats);

module.exports = router;
