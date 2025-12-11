const express = require("express");
const router = express.Router();
const {
  getAllReviews,
  addReview,
  updateReview,
  getToolReviews,
  getUserReviews,
} = require("../controllers/reviewController");

router.post("/getAllReviews", getAllReviews);
router.post("/addReview", addReview);
router.put("/updateReview", updateReview);
router.post("/tool", getToolReviews);
router.post("/user", getUserReviews);

module.exports = router;
