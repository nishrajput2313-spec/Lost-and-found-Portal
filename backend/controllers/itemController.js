const Item = require("../models/Item");
const { asyncHandler } = require("../middleware/errorHandler");
const { findMatches } = require("../utils/matching");

// POST /api/items
const createItem = asyncHandler(async (req, res) => {
  const { type, title, description, category, location, date, verificationQuestions } = req.body;

  if (!type || !title || !category || !location || !date) {
    res.status(400);
    throw new Error("type, title, category, location, and date are required");
  }

  const item = await Item.create({
    type,
    title,
    description,
    category,
    location,
    date,
    imageUrl: req.file ? `/uploads/${req.file.filename}` : "",
    postedBy: req.user._id,
    // verificationQuestions arrives as a JSON string from multipart form-data
    verificationQuestions: verificationQuestions
      ? JSON.parse(verificationQuestions).map((q) => ({ question: q }))
      : [],
  });

  res.status(201).json(item);
});

// GET /api/items?type=lost&category=Bags&location=Library&search=backpack
const getItems = asyncHandler(async (req, res) => {
  const { type, category, location, search, status } = req.query;

  const query = { isActive: true };
  if (type) query.type = type;
  if (category) query.category = category;
  if (location) query.location = location;
  if (status) query.status = status;
  if (search) query.$text = { $search: search };

  const items = await Item.find(query)
    .populate("postedBy", "name")
    .sort({ createdAt: -1 });

  res.json(items);
});

// GET /api/items/mine
const getMyItems = asyncHandler(async (req, res) => {
  const items = await Item.find({ postedBy: req.user._id }).sort({ createdAt: -1 });
  res.json(items);
});

// GET /api/items/:id
const getItemById = asyncHandler(async (req, res) => {
  const item = await Item.findById(req.params.id).populate("postedBy", "name");
  if (!item) {
    res.status(404);
    throw new Error("Item not found");
  }
  res.json(item);
});

// GET /api/items/:id/matches
const getItemMatches = asyncHandler(async (req, res) => {
  const item = await Item.findById(req.params.id);
  if (!item) {
    res.status(404);
    throw new Error("Item not found");
  }

  const matches = await findMatches(item);
  res.json(
    matches.map((m) => ({
      item: m.item,
      score: m.score,
    }))
  );
});

// PATCH /api/items/:id/status   body: { status: "claimed" | "resolved", note?: string }
const updateItemStatus = asyncHandler(async (req, res) => {
  const { status, note } = req.body;
  const item = await Item.findById(req.params.id);

  if (!item) {
    res.status(404);
    throw new Error("Item not found");
  }

  const isOwner = item.postedBy.toString() === req.user._id.toString();
  const isStaff = ["admin", "security"].includes(req.user.role);
  if (!isOwner && !isStaff) {
    res.status(403);
    throw new Error("Only the person who posted this item can update its status");
  }

  const validTransitions = { posted: ["claimed"], claimed: ["resolved", "posted"], resolved: [], inactive: ["posted"] };
  const validStatuses = ["posted", "claimed", "resolved", "inactive"];

  if (!validStatuses.includes(status)) {
    res.status(400);
    throw new Error("Invalid status value");
  }

  // Staff (admin/security) can move an item to any status — e.g. force-resolve
  // a dispute or deactivate a stale post. Regular owners follow the normal flow.
  if (!isStaff && !validTransitions[item.status]?.includes(status)) {
    res.status(400);
    throw new Error(`Cannot move item from "${item.status}" to "${status}"`);
  }

  item.setStatus(status, note);

  // Reward the finder/loser with trust when an item is successfully resolved
  if (status === "resolved") {
    await require("../models/User").findByIdAndUpdate(item.postedBy, { $inc: { trustScore: 1 } });
  }

  await item.save();
  res.json(item);
});

// DELETE /api/items/:id
const deleteItem = asyncHandler(async (req, res) => {
  const item = await Item.findById(req.params.id);
  if (!item) {
    res.status(404);
    throw new Error("Item not found");
  }

  const isOwner = item.postedBy.toString() === req.user._id.toString();
  if (!isOwner && req.user.role !== "admin") {
    res.status(403);
    throw new Error("You can only delete your own posts");
  }

  await item.deleteOne();
  res.json({ message: "Item deleted" });
});

// GET /api/items/stats — real numbers for the homepage stat row
const getStats = asyncHandler(async (req, res) => {
  const totalPosted = await Item.countDocuments({ isActive: true });

  const resolvedItems = await Item.find({ status: "resolved" }).select("statusHistory");

  let avgResolveDays = null;
  if (resolvedItems.length > 0) {
    const gaps = resolvedItems
      .map((item) => {
        const posted = item.statusHistory.find((h) => h.status === "posted");
        const resolved = [...item.statusHistory].reverse().find((h) => h.status === "resolved");
        if (!posted || !resolved) return null;
        return (new Date(resolved.timestamp) - new Date(posted.timestamp)) / 86400000;
      })
      .filter((d) => d !== null);

    if (gaps.length > 0) {
      avgResolveDays = gaps.reduce((sum, d) => sum + d, 0) / gaps.length;
    }
  }

  res.json({
    totalPosted,
    reunited: resolvedItems.length,
    avgResolveDays: avgResolveDays !== null ? Math.round(avgResolveDays * 10) / 10 : null,
  });
});

module.exports = {
  createItem,
  getItems,
  getMyItems,
  getItemById,
  getItemMatches,
  updateItemStatus,
  deleteItem,
  getStats,
};
