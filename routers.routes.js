const express = require("express");
const router = express.Router();

const auth = require("./routes/authRoutes");
const user = require("./routes/userRoutes")




router.use("/api/auth", auth);
router.use("/api/user", user);

module.exports = router;
