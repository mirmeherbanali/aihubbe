const AWS = require("aws-sdk");
const Tool = require("../models/Tolls");
const Category = require("../models/Category");
const User = require("../models/User");
const Admin = require("../models/AdminUser");
const Review = require("../models/Review");
const { response } = require("../common/response/response");


const s3 = new AWS.S3({
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
});

const uploadToS3 = async (file, folder = "tools") => {
  try {
    const params = {
      Bucket: process.env.AWS_BUCKET_NAME,
      Key: `${folder}/${Date.now()}_${file.originalname}`,
      Body: file.buffer,
      ContentType: file.mimetype,
    };
    const upload = await s3.upload(params).promise();
    return upload.Location;
  } catch (err) {
    console.error("S3 Upload Error:", err);
    throw new Error("Failed to upload file to S3");
  }
};

const validateCreator = async (userId) => {
  const user = await User.findById(userId);
  if (user && ["Admin", "Developer"].includes(user.userType)) {
    return true;
  }

  const adminUser = await Admin.findById(userId);
  if (adminUser && adminUser.userType === "AdminUser") {
    return true;
  }

  return false;
};

const createTool = async (req, res) => {
  try {
    let {
      toolName,
      category,
      description,
      pricingType,
      websiteUrl,
      demoVideoUrl,
      tags,
      features,
      userId,
      referringDomains,
      uniqueBacklinks,
    } = req.body;

    if (!toolName) return response(res, false, "Tool name is required");
    if (!category)
      return response(res, false, "At least one category is required");
    if (!userId) return response(res, false, "userId is required");

    const canCreate = await validateCreator(userId);
    if (!canCreate)
      return response(
        res,
        false,
        "Only Admin, Developer, or AdminUser can create tools"
      );

    if (typeof category === "string") {
      try {
        category = JSON.parse(category);
      } catch {
        category = [category];
      }
    }

    if (!Array.isArray(category) || category.length === 0)
      return response(
        res,
        false,
        "Invalid category format, must be an array of IDs"
      );

    const categoryDocs = await Category.find({ _id: { $in: category } });
    if (categoryDocs.length !== category.length) {
      const foundIds = categoryDocs.map((c) => c._id.toString());
      const invalidIds = category.filter(
        (id) => !foundIds.includes(id.toString())
      );
      return response(
        res,
        false,
        `Invalid category IDs: ${invalidIds.join(", ")}`
      );
    }

    let logoUrl = null;
    if (req.files?.logo?.[0]) {
      logoUrl = await uploadToS3(req.files.logo[0], "logos");
    }

    let screenshotUrls = [];
    if (req.files?.screenshots) {
      const uploadPromises = req.files.screenshots.map((file) =>
        uploadToS3(file, "screenshots")
      );
      screenshotUrls = await Promise.all(uploadPromises);
    }

    const parsedTags = tags
      ? typeof tags === "string"
        ? JSON.parse(tags)
        : tags
      : [];
    const parsedFeatures = features
      ? typeof features === "string"
        ? JSON.parse(features)
        : features
      : [];

    const newTool = new Tool({
      toolName,
      logo: logoUrl,
      category,
      description,
      pricingType,
      websiteUrl,
      demoVideoUrl,
      tags: parsedTags,
      features: parsedFeatures,
      screenshots: screenshotUrls,
      userId,
      referringDomains: referringDomains || 0,
      uniqueBacklinks: uniqueBacklinks || 0,
      created_by: userId,
    });

    await newTool.save();
    return response(res, true, "Tool created successfully", newTool);
  } catch (error) {
    console.error("Error creating tool:", error);
    return response(res, false, "Error creating tool", error.message);
  }
};

const updateTool = async (req, res) => {
  try {
    const {
      id,
      toolName,
      category,
      description,
      pricingType,
      websiteUrl,
      demoVideoUrl,
      tags,
      features,
      userId,
      referringDomains,
      uniqueBacklinks,
    } = req.body;

    if (!id) return response(res, false, "Tool ID is required");

    const tool = await Tool.findById(id);
    if (!tool) return response(res, false, "Tool not found");

    if (userId) {
      const canUpdate = await validateCreator(userId);
      if (!canUpdate)
        return response(
          res,
          false,
          "Only Admin, Developer, or AdminUser can update tools"
        );

      tool.userId = userId;
      tool.updated_by = userId;
    }

    if (category) {
      let parsedCategory = category;
      if (typeof parsedCategory === "string") {
        try {
          parsedCategory = JSON.parse(parsedCategory);
        } catch {
          parsedCategory = [parsedCategory];
        }
      }

      if (!Array.isArray(parsedCategory) || parsedCategory.length === 0)
        return response(
          res,
          false,
          "Invalid category format, must be an array of IDs"
        );

      const categoryDocs = await Category.find({
        _id: { $in: parsedCategory },
      });
      if (categoryDocs.length !== parsedCategory.length) {
        const foundIds = categoryDocs.map((c) => c._id.toString());
        const invalidIds = parsedCategory.filter(
          (id) => !foundIds.includes(id.toString())
        );
        return response(
          res,
          false,
          `Invalid category IDs: ${invalidIds.join(", ")}`
        );
      }

      tool.category = parsedCategory;
    }

    if (req.files?.logo?.[0]) {
      tool.logo = await uploadToS3(req.files.logo[0], "logos");
    }

    if (req.files?.screenshots) {
      const uploadPromises = req.files.screenshots.map((file) =>
        uploadToS3(file, "screenshots")
      );
      tool.screenshots = await Promise.all(uploadPromises);
    }

    if (toolName) tool.toolName = toolName;
    if (description) tool.description = description;
    if (pricingType) tool.pricingType = pricingType;
    if (websiteUrl) tool.websiteUrl = websiteUrl;
    if (demoVideoUrl) tool.demoVideoUrl = demoVideoUrl;
    if (tags) tool.tags = typeof tags === "string" ? JSON.parse(tags) : tags;
    if (features)
      tool.features =
        typeof features === "string" ? JSON.parse(features) : features;
    if (referringDomains !== undefined)
      tool.referringDomains = Number(referringDomains) || 0;
    if (uniqueBacklinks !== undefined)
      tool.uniqueBacklinks = Number(uniqueBacklinks) || 0;

    await tool.save();
    return response(res, true, "Tool updated successfully", tool);
  } catch (error) {
    console.error("Error updating tool:", error);
    return response(res, false, "Error updating tool", error.message);
  }
};

const clamp = (value, min, max) => Math.max(min, Math.min(value, max));
const normalize = (value, min, max) => {
  return ((clamp(value, min, max) - min) / (max - min)) * 10;
};
const calculateRankScore = ({ aggregateRating, numReviews, referringDomains, uniqueBacklinks }) => {
  const N_rating = normalize(aggregateRating, 0, 5);
  const N_reviews = normalize(numReviews, 0, 10000);
  const N_domains = normalize(referringDomains, 0, 100);
  const N_links = normalize(uniqueBacklinks, 0, 100);

  const rankScore =
    N_rating * 0.35 +
    N_reviews * 0.20 +
    N_domains * 0.25 +
    N_links * 0.20;

  return parseFloat(rankScore.toFixed(2));
};

const getAllTools = async (req, res) => {
  try {
    let {
      page = 1,
      limit = 10,
      search = "",
      category,
      userId,
    } = req.query;

    page = parseInt(page);
    limit = parseInt(limit);

    let filter = {};
    if (search) filter.toolName = { $regex: search, $options: "i" };
    if (category) filter.category = category;
    if (userId) filter.userId = userId;

    const totalCount = await Tool.countDocuments(filter);

    const tools = await Tool.find(filter)
      .populate("category", "name")
      .populate("userId", "name email")
      .lean(); 

    if (!tools.length) return response(res, false, "No tools found");

    const toolIds = tools.map((t) => t._id);
    const reviewStats = await Review.aggregate([
      { $match: { toolId: { $in: toolIds } } },
      {
        $group: {
          _id: "$toolId",
          avgRating: { $avg: "$rating" },
          countReviews: { $sum: 1 },
        },
      },
    ]);

    const reviewMap = {};
    reviewStats.forEach((r) => {
      reviewMap[r._id.toString()] = {
        aggregateRating: r.avgRating || 0,
        numReviews: r.countReviews || 0,
      };
    });

    const toolsWithScore = tools.map((tool) => {
      const { referringDomains = 0, uniqueBacklinks = 0 } = tool;
      const { aggregateRating = 0, numReviews = 0 } =
        reviewMap[tool._id.toString()] || {};

      const rankScore = calculateRankScore({
        aggregateRating,
        numReviews,
        referringDomains,
        uniqueBacklinks,
      });

      return {
        ...tool,
        aggregateRating: parseFloat(aggregateRating.toFixed(2)),
        numReviews,
        rankScore,
      };
    });

    toolsWithScore.sort((a, b) => {
      if (b.rankScore !== a.rankScore) return b.rankScore - a.rankScore;
      if (b.aggregateRating !== a.aggregateRating)
        return b.aggregateRating - a.aggregateRating;
      return b.referringDomains - a.referringDomains;
    });

    const paginatedTools = toolsWithScore.slice((page - 1) * limit, page * limit);

    return response(res, true, "Tools fetched successfully", {
      list: paginatedTools,
      currentPage: page,
      totalPages: Math.ceil(totalCount / limit),
      totalCount,
    });
  } catch (error) {
    console.error("Error fetching tools:", error);
    return response(res, false, "Error fetching tools", error.message);
  }
};

const getToolDetailsById = async (req, res) => {
  try {
    const { id } = req.body;

    if (!id) return response(res, false, "Tool ID is required");

    const tool = await Tool.findById(id)
      .populate({
        path: "category",
        select: "_id categoryName slug categoryDescription status",
      })
      .populate({
        path: "userId",
        select: "_id firstName lastName email",
      })
      .populate({
        path: "created_by",
        select: "_id firstName lastName email",
      })
      .populate({
        path: "updated_by",
        select: "_id firstName lastName email",
      })
      .lean();

    if (!tool) return response(res, false, "Tool not found");

    // ✅ Fetch all reviews for this tool
    const reviews = await Review.find({ toolId: id })
      .select("_id userId rating reviewText createdAt updatedAt")
      .lean();

    // ✅ Attach reviewer details from User/Admin collections
    const enrichedReviews = await Promise.all(
      reviews.map(async (review) => {
        let reviewer =
          (await User.findById(review.userId).select(
            "_id firstName lastName email"
          )) ||
          (await Admin.findById(review.userId).select(
            "_id firstName lastName email"
          ));

        return {
          ...review,
          reviewer: reviewer || null,
        };
      })
    );

    // ✅ Merge reviews with tool details
    const toolWithReviews = {
      ...tool,
      reviews: enrichedReviews,
    };

    return response(
      res,
      true,
      "Tool details (with reviews) fetched successfully",
      toolWithReviews
    );
  } catch (error) {
    console.error("Error fetching tool details:", error);
    return response(res, false, "Error fetching tool details", error.message);
  }
};

const deleteTool = async (req, res) => {
  try {
    const { id, adminId } = req.body;

    if (!id) return response(res, false, "Tool ID is required");
    if (!adminId) return response(res, false, "Admin ID is required");

    const adminExists =
      (await Admin.findById(adminId)) || (await User.findById(adminId));

    if (!adminExists) {
      return response(res, false, "Invalid Admin ID. Permission denied.");
    }

    const tool = await Tool.findById(id);
    if (!tool) return response(res, false, "Tool not found");

    await Tool.findByIdAndDelete(id);

    return response(res, true, "Tool deleted successfully");
  } catch (error) {
    console.error("Error deleting tool:", error);
    return response(res, false, "Error deleting tool", error.message);
  }
};

module.exports = {
  createTool,
  getAllTools,
  getToolDetailsById,
  deleteTool,
  updateTool,
};
