const express = require("express");

const {
  createBlogCategory,
  getAllBlogCategories,
  updateBlogCategory,
  deleteBlogCategory,
} = require("../controllers/blogCategoryController");

const router = express.Router();


router.post("/create", createBlogCategory);

router.post("/getAllBlogCategories", getAllBlogCategories);

router.put("/updateBlogCategory", updateBlogCategory);

router.put("/deleteBlogCategory", deleteBlogCategory);

module.exports = router;
