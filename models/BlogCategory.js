const mongoose = require("mongoose");

const blogCategorySchema = new mongoose.Schema(
  {
    categoryName: {
      type: String,
      required: true,
      trim: true,
      unique: true,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model(
  "BlogCategory",
  blogCategorySchema,
  "blog_categories"
);
