const mongoose = require("mongoose");

const statusHistorySchema = new mongoose.Schema(
  {
    status: {
      type: String,
      enum: ["posted", "claimed", "resolved"],
      required: true,
    },
    timestamp: { type: Date, default: Date.now },
    note: { type: String }, // optional, e.g. "Auto-expired after 30 days"
  },
  { _id: false }
);

const verificationQuestionSchema = new mongoose.Schema(
  {
    question: { type: String, required: true },
  },
  { _id: true }
);

const itemSchema = new mongoose.Schema(
  {
    type: { type: String, enum: ["lost", "found"], required: true },
    title: { type: String, required: true, trim: true },
    description: { type: String, trim: true, default: "" },
    category: {
      type: String,
      required: true,
      enum: [
        "Electronics",
        "Bags",
        "ID Card",
        "Accessories",
        "Books & Notes",
        "Personal Items",
        "Other",
      ],
    },
    location: { type: String, required: true, trim: true },
    date: { type: Date, required: true },
    imageUrl: { type: String, default: "" },

    postedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },

    status: {
      type: String,
      enum: ["posted", "claimed", "resolved", "inactive"],
      default: "posted",
    },
    statusHistory: {
      type: [statusHistorySchema],
      default: () => [{ status: "posted" }],
    },

    verificationQuestions: [verificationQuestionSchema],

    isActive: { type: Boolean, default: true }, // flips false on auto-expiry
  },
  { timestamps: true }
);

// Speeds up browse/search/filter queries
itemSchema.index({ title: "text", description: "text", category: 1, location: 1 });

// Helper to move an item to a new status and log it in the timeline
itemSchema.methods.setStatus = function (newStatus, note) {
  this.status = newStatus;
  this.statusHistory.push({ status: newStatus, timestamp: new Date(), note });
};

module.exports = mongoose.model("Item", itemSchema);
