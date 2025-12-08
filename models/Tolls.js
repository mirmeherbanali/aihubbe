const mongoose = require("mongoose");

const toolSchema = new mongoose.Schema(
  {
    toolName: { type: String, required: true, trim: true },
    logo: { type: String, trim: true },
    category: [
      { type: mongoose.Schema.Types.ObjectId, ref: "Category", required: true },
    ],
    description: { type: String, trim: true },
    pricingType: {
      type: String,
      enum: ["Free", "Paid", "Premium"],
      default: "Free",
    },
    websiteUrl: { type: String, trim: true },
    demoVideoUrl: { type: String, trim: true },
    tags: [{ type: String, trim: true }],
    features: [{ type: String }],
    screenshots: [{ type: String, trim: true }],
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    referringDomains: { type: Number, default: 0 },
    uniqueBacklinks: { type: Number, default: 0 },
    status: {
      type: String,
      enum: ["Pending", "Approved", "Rejected"],
      default: "Pending",
    },
    created_by: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    updated_by: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Tool", toolSchema, "tools");
