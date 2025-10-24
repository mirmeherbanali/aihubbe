const express = require("express");
const router = express.Router();
const {getAllUsers, getUserById,updateUser,deleteUser } = require("../controllers/userController");
const checkAuth = require("../middleware/authMiddleware");

router.post("/getAllUsers", getAllUsers);
router.post("/getUserById",checkAuth, getUserById);
router.put("/updateUser", updateUser);
router.put("/deleteUser", deleteUser);

module.exports = router;