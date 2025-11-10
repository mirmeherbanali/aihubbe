const express = require("express");
const multer = require("multer");
const { createTool,updateTool,getAllTools,getToolDetailsById,deleteTool  } = require("../controllers/tollController");

const router = express.Router();
const storage = multer.memoryStorage();

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, 
});


router.post("/create",upload.fields([{ name: "logo", maxCount: 1 },{ name: "screenshots", maxCount: 5 },]), createTool);
router.post("/getAllTools", getAllTools);
router.post("/getToolDetailsById", getToolDetailsById);
router.put("/deleteTool", deleteTool);
router.put("/updateTool",upload.fields([{ name: "logo", maxCount: 1 },{ name: "screenshots", maxCount: 5 },]), updateTool);

module.exports = router;
