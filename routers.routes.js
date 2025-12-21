const express = require("express");
const router = express.Router();

const auth = require("./routes/authRoutes");
const user = require("./routes/userRoutes")
const adminUser = require("./routes/adminUserRoutes")
const category = require("./routes/categoryRoutes")
const tool = require("./routes/tollRoutes")
const review = require("./routes/reviewRoutes")
const blogCategory = require("./routes/blogCategoryRoutes")
const blog = require("./routes/blogRoutes")
const author = require("./routes/authorRoutes")




router.use("/api/auth", auth);
router.use("/api/user", user);
router.use("/api/adminUser", adminUser);
router.use("/api/category", category);
router.use("/api/tool", tool);
router.use("/api/review", review);
router.use("/api/author", author);
router.use("/api/blogCategory", blogCategory);
router.use("/api/blog", blog);

module.exports = router;
