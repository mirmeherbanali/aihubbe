const express = require("express");
const multer = require("multer");

const {
  createBlog,
  updateBlog,
  getAllBlogs,
  getBlogById,
  deleteBlog,
  getBlogsByCategory,
} = require("../controllers/blogController");

const router = express.Router();

const storage = multer.memoryStorage();

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
});


router.post("/create",upload.fields([{ name: "featuredImage", maxCount: 1 }, ]), createBlog);
router.post("/getAllBlogs", getAllBlogs);
router.post("/getBlogById", getBlogById);
router.post("/getBlogsByCategory", getBlogsByCategory);
router.put("/updateBlog",upload.fields([{ name: "featuredImage", maxCount: 1 },]),updateBlog);
router.put("/deleteBlog", deleteBlog);

module.exports = router;
