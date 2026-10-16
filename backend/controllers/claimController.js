const ClaimRequest = require("../models/ClaimRequest");
const Item = require("../models/Item");
const { asyncHandler } = require("../middleware/errorHandler");

// POST /api/items/:id/claim   body: { answers: [{ question, answer }] }
const submitClaim = asyncHandler(async (req, res) => {
  const item = await Item.findById(req.params.id);
  if (!item) {
    res.status(404);
    throw new Error("Item not found");
  }
  if (item.postedBy.toString() === req.user._id.toString()) {
    res.status(400);
    throw new Error("You can't claim your own post");
  }

  const claim = await ClaimRequest.create({
    item: item._id,
    claimant: req.user._id,
    answers: req.body.answers || [],
  });

  // Move the item into "claimed" so the timeline reflects a pending review
  if (item.status === "posted") {
    item.setStatus("claimed", "Claim request submitted, pending review");
    await item.save();
  }

  res.status(201).json(claim);
});

// GET /api/items/:id/claims  (owner only)
const getClaimsForItem = asyncHandler(async (req, res) => {
  const item = await Item.findById(req.params.id);
  if (!item) {
    res.status(404);
    throw new Error("Item not found");
  }
  if (item.postedBy.toString() !== req.user._id.toString()) {
    res.status(403);
    throw new Error("Only the person who posted this item can view claim requests");
  }

  const claims = await ClaimRequest.find({ item: item._id })
    .populate("claimant", "name email trustScore")
    .sort({ createdAt: -1 });

  res.json(claims);
});

// PATCH /api/claims/:claimId   body: { status: "approved" | "rejected" }
const decideClaim = asyncHandler(async (req, res) => {
  const { status } = req.body;
  if (!["approved", "rejected"].includes(status)) {
    res.status(400);
    throw new Error('status must be "approved" or "rejected"');
  }

  const claim = await ClaimRequest.findById(req.params.claimId).populate("item");
  if (!claim) {
    res.status(404);
    throw new Error("Claim request not found");
  }
  if (claim.item.postedBy.toString() !== req.user._id.toString()) {
    res.status(403);
    throw new Error("Only the person who posted this item can decide on claims");
  }

  claim.status = status;
  await claim.save();

  const item = await Item.findById(claim.item._id);
  if (status === "approved") {
    item.setStatus("resolved", "Claim approved — item returned to owner");
  } else if (item.status === "claimed") {
    // No approved claimant yet — reopen the listing
    item.setStatus("posted", "Claim rejected — reopened for other claimants");
  }
  await item.save();

  res.json(claim);
});

module.exports = { submitClaim, getClaimsForItem, decideClaim };
