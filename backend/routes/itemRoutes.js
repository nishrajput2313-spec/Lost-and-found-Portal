const express = require("express");
const router = express.Router();

const {
  createItem,
  getItems,
  getMyItems,
  getItemById,
  getItemMatches,
  updateItemStatus,
  deleteItem,
  getStats,
} = require("../controllers/itemController");
const { submitClaim, getClaimsForItem } = require("../controllers/claimController");

const { protect } = require("../middleware/auth");
const upload = require("../middleware/upload");

router.get("/mine", protect, getMyItems);
router.get("/stats", getStats);

router.route("/")
  .get(getItems)
  .post(protect, upload.single("photo"), createItem);

router.route("/:id")
  .get(getItemById)
  .delete(protect, deleteItem);

router.get("/:id/matches", getItemMatches);
router.patch("/:id/status", protect, updateItemStatus);

router.post("/:id/claim", protect, submitClaim);
router.get("/:id/claims", protect, getClaimsForItem);

module.exports = router;
