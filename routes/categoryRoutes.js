const express = require("express");
const router = express.Router();
const {  createCategory,getAllCategories,updateCategory,deleteCategory,getCategoryById} = require("../controllers/categoryController");
const checkAuth = require("../middleware/authMiddleware");

router.post("/createCategory",checkAuth, createCategory);
router.post("/getAllCategories",checkAuth, getAllCategories);
router.post("/getCategoryById",checkAuth, getCategoryById);
router.put("/updateCategory",checkAuth, updateCategory);
router.put("/deleteCategory",checkAuth, deleteCategory);


module.exports = router;
