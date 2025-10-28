const express = require("express");
const router = express.Router();
const { addAdminUser,updateAdminUser,deleteAdminUser} = require("../controllers/adminUserController");
const checkAuth = require("../middleware/authMiddleware");

router.post("/addAdminUser", addAdminUser);
router.put("/updateAdminUser", updateAdminUser);
router.put("/deleteAdminUser", deleteAdminUser);


module.exports = router;
