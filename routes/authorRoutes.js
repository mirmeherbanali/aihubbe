const express = require("express");
const multer = require("multer");

const {
  createAuthor,
  getAllAuthors,
  getAuthorById,
  updateAuthor,
  deleteAuthor,
} = require("../controllers/authorController");

const router = express.Router();

const storage = multer.memoryStorage();

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, 
});


router.post("/create",upload.fields([{ name: "authorImage", maxCount: 1 }]),createAuthor);

router.post("/getAllAuthors", getAllAuthors);

router.post("/getAuthorById", getAuthorById);

router.put("/updateAuthor",upload.fields([{ name: "authorImage", maxCount: 1 }]),updateAuthor);

router.put("/deleteAuthor", deleteAuthor);

module.exports = router;
