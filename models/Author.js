const mongoose = require("mongoose");

const authorSchema = new mongoose.Schema(
  {
    authorName: {
      type: String,
      required: true,
      trim: true,
    },

    authorBio: {
      type: String,
      trim: true,
    },

    socialLinks: [
      {
          type: String,
          trim: true,
        },
    ],

    authorImage: {
      type: String,
      trim: true,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Author", authorSchema, "authors");
