const Review = require("../models/Review");
const Tool = require("../models/Tolls");
const User = require("../models/User");
const Admin = require("../models/AdminUser");
const { response } = require("../common/response/response");

const getAllReviews = async (req, res) => {
  const {
    search,
    sort = -1,
    sortingFor = "createdAt",
    currentPage,
    limit,
  } = req.body;

  try {
    let filter = {};
    if (search) {
      filter.reviewText = { $regex: search, $options: "i" };
    }
    const totalCount = await Review.countDocuments(filter);

    let query = Review.find(filter)
      .populate("userId", "name email")
      .populate("toolId", "toolName logo")
      .collation({ locale: "en", strength: 2 })
      .sort({ [sortingFor]: sort });

    let totalPages = 1;
    let hasMore = false;
    let pageNumber = currentPage ? parseInt(currentPage) : undefined;
    let pageSize = limit ? parseInt(limit) : undefined;

    if (pageSize) {
      let skip = ((pageNumber || 1) - 1) * pageSize;
      totalPages = Math.ceil(totalCount / pageSize);
      hasMore = skip + pageSize < totalCount;
      query = query.skip(skip).limit(pageSize);
    }

    const reviews = await query.lean();

    if (reviews.length === 0) {
      return response(res, false, "No reviews found");
    }

    return response(
      res,
      true,
      "Reviews fetched successfully",
      reviews,
      totalCount,
      pageNumber,
      totalPages,
      hasMore
    );
  } catch (error) {
    console.error("Error fetching all reviews:", error);
    return response(res, false, error.message);
  }
};

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
        "You have already given a review for this tool"
      );

    const newReview = new Review({
      toolId,
      userId,
      rating,
      reviewText,
      status: "Pending",
      addedTime: Date.now(),
    });
    await newReview.save();

    return response(res, true, "Review Submited successfully", newReview);
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

    const reviews = await Review.find({
      toolId,
      status: "Approved",
    })
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
  getAllReviews,
  addReview,
  updateReview,
  getToolReviews,
  getUserReviews,
};
