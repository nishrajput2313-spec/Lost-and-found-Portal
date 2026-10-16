const Item = require("../models/Item");
const { asyncHandler } = require("../middleware/errorHandler");

// GET /api/admin/items — every item, regardless of isActive, for moderation
const getAllItemsAdmin = asyncHandler(async (req, res) => {
  const items = await Item.find({})
    .populate("postedBy", "name email")
    .sort({ createdAt: -1 });
  res.json(items);
});

// GET /api/admin/stats — totals + category/status breakdown for the dashboard
const getAdminStats = asyncHandler(async (req, res) => {
  const totalPosted = await Item.countDocuments({});
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
    if (gaps.length > 0) avgResolveDays = gaps.reduce((s, d) => s + d, 0) / gaps.length;
  }

  const byStatus = await Item.aggregate([{ $group: { _id: "$status", count: { $sum: 1 } } }]);
  const byCategory = await Item.aggregate([{ $group: { _id: "$category", count: { $sum: 1 } } }]);

  res.json({
    totalPosted,
    reunited: resolvedItems.length,
    avgResolveDays: avgResolveDays !== null ? Math.round(avgResolveDays * 10) / 10 : null,
    byStatus: byStatus.map((s) => ({ status: s._id, count: s.count })),
    byCategory: byCategory.map((c) => ({ category: c._id, count: c.count })),
  });
});

module.exports = { getAllItemsAdmin, getAdminStats };
