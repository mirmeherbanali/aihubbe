const express = require("express");
const multer = require("multer");
const { createTool,getAllTools  } = require("../controllers/tollController");

const router = express.Router();
const storage = multer.memoryStorage();

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, 
});


router.post("/create",upload.fields([{ name: "logo", maxCount: 1 },{ name: "screenshots", maxCount: 5 },]), createTool);
router.get("/getAllTools", getAllTools);

module.exports = router;
