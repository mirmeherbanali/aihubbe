const Review = require("../models/Review");
const Tool = require("../models/Tolls");
const User = require("../models/User");
const Admin = require("../models/AdminUser");
const { response } = require("../common/response/response");

const addReview = async (req, res) => {
  try {
    const { toolId, userId, rating, reviewText } = req.body;

    if (!toolId) return response(res, false, "toolId is required");
    if (!userId) return response(res, false, "userId is required");
    if (!rating) return response(res, false, "rating is required");

    const toolExists = await Tool.findById(toolId);
    if (!toolExists) return response(res, false, "Tool not found");

     const userExists =
      (await User.findById(userId)) || (await Admin.findById(userId));
    if (!userExists) return response(res, false, "User not found");

    const existingReview = await Review.findOne({ toolId, userId });
    if (existingReview)
      return response(
        res,
        false,
        "Review already exists. Please update instead."
      );

    const newReview = new Review({ toolId, userId, rating, reviewText,  status: "Pending",addedTime: Date.now() });
    await newReview.save();

    return response(res, true, "Review added successfully", newReview);
  } catch (error) {
    console.error("Error adding review:", error);
    return response(res, false, "Error adding review", error.message);
  }
};

const updateReview = async (req, res) => {
  try {
    const { toolId, userId, rating, reviewText, status } = req.body;

    if (!toolId) return response(res, false, "toolId is required");
    if (!userId) return response(res, false, "userId is required");
    if (!rating) return response(res, false, "rating is required");

    const existingReview = await Review.findOne({ toolId, userId });
    if (!existingReview)
      return response(res, false, "Review not found. Please add first.");

    existingReview.rating = rating;
    existingReview.reviewText = reviewText;
    existingReview.updatedTime = Date.now();

    if (status) existingReview.status = status; 

    await existingReview.save();

    return response(res, true, "Review updated successfully", existingReview);
  } catch (error) {
    console.error("Error updating review:", error);
    return response(res, false, "Error updating review", error.message);
  }
};


const getToolReviews = async (req, res) => {
  try {
    const { toolId } = req.body;

    const reviews = await Review.find({ toolId })
      .populate("userId", "name email")
      .sort({ createdAt: -1 });

    return response(res, true, "Tool reviews fetched successfully", reviews);
  } catch (error) {
    console.error("Error fetching reviews:", error);
    return response(res, false, "Error fetching reviews", error.message);
  }
};

const getUserReviews = async (req, res) => {
  try {
    const { userId } = req.body;

    const reviews = await Review.find({ userId })
      .populate("toolId", "toolName logo")
      .sort({ updatedAt: -1 });

    return response(res, true, "User reviews fetched successfully", reviews);
  } catch (error) {
    console.error("Error fetching user reviews:", error);
    return response(res, false, "Error fetching user reviews", error.message);
  }
};

module.exports = {
  addReview,
  updateReview,
  getToolReviews,
  getUserReviews,
};
