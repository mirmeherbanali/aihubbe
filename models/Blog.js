const mongoose = require("mongoose");

const blogSchema = new mongoose.Schema(
  {
    blogTitle: {
      type: String,
      required: true,
      trim: true,
    },

    slug: {
      type: String,
      trim: true,
      unique: true,
    },

    content: {
      type: String,
      trim: true,
      required: true,
    },

    shortDescription: {
      type: String,
      trim: true,
    },

    metaDescription: {
      type: String,
      trim: true,
    },

    featuredImage: {
      url: {
        type: String,
        trim: true,
      },
      altText: {
        type: String,
        trim: true,
      },
      titleText: {
        type: String,
        trim: true,
      },
    },

    categories: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "BlogCategory",
        required: true,
      },
    ],

    author: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Author",
      required: true,
    },

    status: {
      type: String,
      enum: ["Draft", "Published"],
      default: "Draft",
    },

    publishedDate: {
      type: Date,
    },

    lastModifiedDate: {
      type: Date,
    },

    jsonLdSchema: {
      type: String,
    },
    metaRobots: {
      type: String,
      enum: ["index, follow", "noindex, nofollow"],
      default: "index, follow",
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
  { timestamps: true },
);

module.exports = mongoose.model("Blog", blogSchema, "blogs");
