const mongoose = require("mongoose");

const reviewSchema = new mongoose.Schema(
  {
    toolId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Tool",
      required: true,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    rating: {
      type: Number,
      required: true,
      min: 1,
      max: 5,
    },
    reviewText: {
      type: String,
      trim: true,
    },
    status: {
      type: String,
      enum: ["Pending", "Approved", "Rejected"],
      default: "Pending",
    },

    addedTime: {
      type: Date,
      default: Date.now,
    },
    updatedTime: {
      type: Date,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Review", reviewSchema, "reviews");
