const { response } = require("../common/response/response");
const Category = require("../models/Category");
const Admin = require("../models/AdminUser");
const User = require("../models/User");
const Tool = require("../models/Tolls");
const Review = require("../models/Review");


// const createCategory = async (req, res) => {
//   try {
//     const { adminId, categoryName, slug, categoryDescription, faqs } = req.body;

//     if (!adminId) return response(res, false, "AdminId is required");
//     if (!categoryName) return response(res, false, "Category name is required");
//     if (!slug) return response(res, false, "Slug is required");

//     const existingAdmin = await User.findOne({
//       _id: adminId,
//       userType: "Admin",
//       status: "Active",
//     });
//     if (!existingAdmin) return response(res, false, "Admin not found");

//     const existingCategory = await Category.findOne({
//       adminId,
//       $and: [{ slug: slug }, { categoryName: categoryName }],
//     });

//     if (existingCategory) {
//       return response(
//         res,
//         false,
//         "Category with this name or slug already exists"
//       );
//     }

//     const category = new Category({
//       adminId,
//       categoryName,
//       slug,
//       categoryDescription: categoryDescription || "",
//       faqs: faqs || [],
//       status: "Active",
//     });

//     await category.save();

//     return response(res, true, "Category created successfully", category);
//   } catch (error) {
//     return response(res, false, error.message);
//   }
// };

// const getAllCategories = async (req, res) => {
//   try {
//     const categories = await Category.find({ status: { $ne: "Deleted" } })
//       .populate("adminId", "firstName lastName email")
//       .sort({ createdAt: -1 });

//     return response(res, true, "All categories fetched", categories);
//   } catch (error) {
//     return response(res, false, error.message);
//   }
// };

// const getCategoryById = async (req, res) => {
//   try {
//     const { categoryId } = req.body;

//     if (!categoryId) {
//       return response(res, false, "Category ID is required");
//     }

//     const category = await Category.findOne({
//       _id: categoryId,
//       status: { $ne: "Deleted" },
//     })
//       .populate("adminId")
//       .lean();

//     if (!category) {
//       return response(res, false, "Category not found");
//     }

//    const tools = await Tool.find({
//       category: categoryId,
//       status: "Approved",
//     })
//       .populate("userId")
//       .populate("category")
//       .populate("created_by")
//       .populate("updated_by")
//       .lean();

//     const toolIds = tools.map((t) => t._id);

//     if (toolIds.length === 0) {
//       return response(res, true, "Category fetched", {
//         category,
//         tools: [],
//         reviewSummary: {},
//       });
//     }
//     const reviews = await Review.find({ toolId: { $in: toolIds } })
//       .populate("userId")
//       .lean();

//     let globalTotalReviews = 0;
//     let globalRatingSum = 0;
//     let globalBreakdown = { "1": 0, "2": 0, "3": 0, "4": 0, "5": 0 };

//     const toolsWithReviewData = tools.map((tool) => {
//       const toolReviews = reviews.filter((r) => String(r.toolId) === String(tool._id));

//       const toolReviewCount = toolReviews.length;

//       let ratingSum = 0;
//       let breakdown = { "1": 0, "2": 0, "3": 0, "4": 0, "5": 0 };

//       toolReviews.forEach((r) => {
//         ratingSum += r.rating;
//         breakdown[r.rating]++;

    
//         globalTotalReviews++;
//         globalRatingSum += r.rating;
//         globalBreakdown[r.rating]++;
//       });

//       const avgRating =
//         toolReviewCount > 0 ? (ratingSum / toolReviewCount).toFixed(2) : 0;

//       return {
//         ...tool,
//         reviewSummary: {
//           totalReviews: toolReviewCount,
//           avgRating,
//           ratingBreakdown: breakdown,
//           reviews: toolReviews, 
//         },
//       };
//     });

//     const globalAvgRating =
//       globalTotalReviews > 0 ? (globalRatingSum / globalTotalReviews).toFixed(2) : 0;

//     const data = {
//       category,
//       tools: toolsWithReviewData,
//       finalSummary: {
//         totalReviews: globalTotalReviews,
//         avgRating: globalAvgRating,
//         ratingBreakdown: globalBreakdown,
//       },
//     };

//     return response(
//       res,
//       true,
//       "Category, tools, and review stats fetched successfully",
//       data
//     );
//   } catch (error) {
//     console.error("Error fetching category details:", error);
//     return response(res, false, error.message);
//   }
// };


// const updateCategory = async (req, res) => {
//   try {
//     const { id, adminId, categoryName, slug, categoryDescription, faqs } =
//       req.body;

//     if (!id) return response(res, false, "Category ID is required");
//     if (!adminId) return response(res, false, "AdminId is required");
//     if (!categoryName) return response(res, false, "Category name is required");
//     if (!slug) return response(res, false, "Slug is required");

//     const existingAdmin = await User.findOne({
//       _id: adminId,
//       userType: "Admin",
//       status: "Active",
//     });
//     if (!existingAdmin) return response(res, false, "Admin not found");

//     const category = await Category.findById(id);
//     if (!category) return response(res, false, "Category not found");
//     const duplicateCategory = await Category.findOne({
//       adminId,
//       $and: [{ slug: slug }, { categoryName: categoryName }],
//       _id: { $ne: id },
//     });

//     if (duplicateCategory) {
//       return response(
//         res,
//         false,
//         "Another category with this name or slug already exists"
//       );
//     }

//     category.categoryName = categoryName;
//     category.slug = slug;
//     category.categoryDescription =
//       categoryDescription || category.categoryDescription;
//     category.faqs = faqs || category.faqs;

//     await category.save();

//     return response(res, true, "Category updated successfully", category);
//   } catch (error) {
//     return response(res, false, error.message);
//   }
// };

// const deleteCategory = async (req, res) => {
//   try {
//     const { id, adminId } = req.body;

//     if (!id) return response(res, false, "CategoryId is required");
//     if (!adminId) return response(res, false, "AdminId is required");

//     const admin = await User.findOne({
//       _id: adminId,
//       status: "Active",
//       userType: "Admin",
//     });
//     if (!admin) return response(res, false, "Admin not found");

//     const category = await Category.findById(id);
//     if (!category) return response(res, false, "Category not found");

//     category.status = "Deleted";
//     await category.save();

//     return response(res, true, "Category deleted successfully", category);
//   } catch (error) {
//     return response(res, false, error.message);
//   }
// };
const createCategory = async (req, res) => {
  try {
    const { adminId, categoryName, slug, categoryDescription, faqs } = req.body;

    if (!adminId || !categoryName || !slug)
      return response(res, false, "Required fields missing");

    const admin = await User.findOne({
      _id: adminId,
      userType: "Admin",
      status: "Active",
    }).lean();

    if (!admin) return response(res, false, "Admin not found");

    // ✅ FAST CHECK
    const exists = await Category.exists({
      $or: [{ slug }, { categoryName }],
    });

    if (exists)
      return response(res, false, "Category already exists");

    const category = await Category.create({
      adminId,
      categoryName,
      slug,
      categoryDescription: categoryDescription || "",
      faqs: faqs || [],
    });

    return response(res, true, "Category created", category);
  } catch (err) {
    return response(res, false, err.message);
  }
};
const getAllCategories = async (req, res) => {
  try {
    const categories = await Category.find({
      status: { $ne: "Deleted" },
    })
      .populate("adminId", "firstName lastName email")
      .sort({ createdAt: -1 })
      .lean();

    return response(res, true, "All categories fetched", categories);
  } catch (err) {
    return response(res, false, err.message);
  }
};
const updateCategory = async (req, res) => {
  try {
    const { id, adminId, categoryName, slug, categoryDescription, faqs } =
      req.body;

    if (!id || !adminId || !categoryName || !slug)
      return response(res, false, "Required fields missing");

    const admin = await User.findOne({
      _id: adminId,
      userType: "Admin",
      status: "Active",
    });

    if (!admin) return response(res, false, "Admin not found");

    await Category.findByIdAndUpdate(id, {
      $set: {
        categoryName,
        slug,
        categoryDescription,
        faqs,
      },
    });

    const updated = await Category.findById(id).lean();

    return response(res, true, "Updated", updated);
  } catch (err) {
    return response(res, false, err.message);
  }
};
const getCategoryById = async (req, res) => {
  try {
    const { categoryId } = req.body;

    if (!categoryId)
      return response(res, false, "Category ID required");

    // ✅ PARALLEL CALLS
    const [category, tools] = await Promise.all([
      Category.findOne({
        _id: categoryId,
        status: { $ne: "Deleted" },
      })
        .populate("adminId")
        .lean(),

      Tool.find({
        category: categoryId,
        status: "Approved",
      })
        .populate("userId")
        .populate("category")
        .populate("created_by")
        .populate("updated_by")
        .lean(),
    ]);

    if (!category)
      return response(res, false, "Category not found");

    const toolIds = tools.map((t) => t._id);

    // ✅ FETCH ALL REVIEWS ONCE
    const reviews = await Review.find({
      toolId: { $in: toolIds },
    }).lean();

    // ✅ GROUP REVIEWS (NO FILTER LOOP)
    const reviewMap = {};

    reviews.forEach((r) => {
      const key = r.toolId.toString();
      if (!reviewMap[key]) reviewMap[key] = [];
      reviewMap[key].push(r);
    });

    let globalTotal = 0;
    let globalSum = 0;
    let breakdown = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };

    const toolsWithReview = tools.map((tool) => {
      const toolReviews = reviewMap[tool._id] || [];

      let sum = 0;
      let localBreak = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };

      toolReviews.forEach((r) => {
        sum += r.rating;
        localBreak[r.rating]++;
        globalTotal++;
        globalSum += r.rating;
        breakdown[r.rating]++;
      });

      return {
        ...tool,
        reviewSummary: {
          totalReviews: toolReviews.length,
          avgRating: toolReviews.length
            ? (sum / toolReviews.length).toFixed(2)
            : 0,
          ratingBreakdown: localBreak,
          reviews: toolReviews,
        },
      };
    });

    return response(res, true, "Success", {
      category,
      tools: toolsWithReview,
      finalSummary: {
        totalReviews: globalTotal,
        avgRating: globalTotal ? (globalSum / globalTotal).toFixed(2) : 0,
        ratingBreakdown: breakdown,
      },
    });
  } catch (err) {
    return response(res, false, err.message);
  }
};
const deleteCategory = async (req, res) => {
  try {
    const { id, adminId } = req.body;

    if (!id || !adminId)
      return response(res, false, "Required fields missing");

    await Category.findByIdAndUpdate(id, {
      $set: { status: "Deleted" },
    });

    return response(res, true, "Deleted");
  } catch (err) {
    return response(res, false, err.message);
  }
};
module.exports = {
  createCategory,
  getAllCategories,
  updateCategory,
  deleteCategory,
  getCategoryById,
};
