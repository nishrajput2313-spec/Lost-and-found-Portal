const express = require("express");
const router = express.Router();
const { decideClaim } = require("../controllers/claimController");
const { protect } = require("../middleware/auth");

router.patch("/:claimId", protect, decideClaim);

module.exports = router;
