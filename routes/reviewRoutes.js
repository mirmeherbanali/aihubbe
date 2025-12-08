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
router.post("/tool/:toolId", getToolReviews);
router.post("/user/:userId", getUserReviews);

module.exports = router;
