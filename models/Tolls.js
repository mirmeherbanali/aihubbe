const mongoose = require("mongoose");

const toolSchema = new mongoose.Schema(
  {
    toolName: { type: String, required: true, trim: true },
    logo: { type: String, trim: true }, 
    category: {type: mongoose.Schema.Types.ObjectId,ref: "Category",required: true,},
    description: { type: String, trim: true },
    pricingType: { type: String, enum: ["Free", "Paid", "Freemium"], default: "Free" },
    websiteUrl: { type: String, trim: true },
    demoVideoUrl: { type: String, trim: true },
    tags: [{ type: String, trim: true }],
    features: [{ type: String }], 
    screenshots: [{ type: String, trim: true }], 
    developerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    status: { type: String, enum: ["Pending", "Approved", "Rejected"], default: "Pending" },
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
