const AWS = require("aws-sdk");
const Tool = require("../models/Tolls");
const Category = require("../models/Category");
const User = require("../models/User");
const Admin = require("../models/AdminUser");
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

    await tool.save();
    return response(res, true, "Tool updated successfully", tool);
  } catch (error) {
    console.error("Error updating tool:", error);
    return response(res, false, "Error updating tool", error.message);
  }
};
const getAllTools = async (req, res) => {
  const {
    userId,
    search,
    category,
    status,
    sort = 1,
    sortingFor = "toolName",
    currentPage,
    limit,
  } = req.body;

  try {
    let filter = {};

    if (userId) {
      filter.userId = userId;
    }

    if (category) {
      filter.category = category;
    }

    if (status) {
      filter.status = Array.isArray(status) ? { $in: status } : status;
    }

    if (search) {
      filter.toolName = { $regex: search, $options: "i" };
    }

    
    const totalCount = await Tool.countDocuments(filter);
    let query = Tool.find(filter)
      .populate("userId", "firstName lastName email")
      .populate("category", "categoryName")
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

    const tools = await query.lean();

    if (tools.length === 0) {
      return response(
        res,
        false,
        userId
          ? "No Tools found for this user"
          : "No Tools matching the search criteria"
      );
    }


    return response(
      res,
      true,
      "Tools fetched successfully",
      tools,
      totalCount,
      pageNumber,
      totalPages,
      hasMore
    );
  } catch (error) {
    return response(res, false, error.message);
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

    return response(res, true, "Tool details fetched successfully", tool);
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
