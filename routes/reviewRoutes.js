const express = require("express");
const router = express.Router();
const {
  addReview,
  updateReview,
  getToolReviews,
  getUserReviews,
} = require("../controllers/reviewController");

router.post("/addReview", addReview);
router.put("/updateReview", updateReview);
router.get("/tool/:toolId", getToolReviews);
router.get("/user/:userId", getUserReviews);

module.exports = router;
