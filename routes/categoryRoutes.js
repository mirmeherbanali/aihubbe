const express = require("express");
const router = express.Router();
const {  createCategory,getAllCategories,updateCategory,deleteCategory,getCategoryById} = require("../controllers/categoryController");
const checkAuth = require("../middleware/authMiddleware");

router.post("/createCategory", createCategory);
router.post("/getAllCategories", getAllCategories);
router.post("/getCategoryById", getCategoryById);
router.put("/updateCategory", updateCategory);
router.put("/deleteCategory", deleteCategory);


module.exports = router;
