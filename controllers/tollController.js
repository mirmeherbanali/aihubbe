const AWS = require("aws-sdk");
const Tool = require("../models/Tolls");
const Category = require("../models/Category");
const User = require("../models/User")
const { response } = require("../common/response/response");

const s3 = new AWS.S3({
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
});

const uploadToS3 = async (file, folder = "tools") => {
  try {
    console.log(`Uploading ${file.originalname} to folder: ${folder}`);
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


const createTool = async (req, res) => {
  try {
    const {
      toolName,
      category,
      description,
      pricingType,
      websiteUrl,
      demoVideoUrl,
      tags,
      features,
      developerId,
    } = req.body;
    if (!toolName) return response(res, false, "Tool name is required");
    if (!category) return response(res, false, "Category is required");
    if (!developerId) return response(res, false, "Developer ID is required");

    const categoryExists = await Category.findById(category);
    if (!categoryExists) return response(res, false, "Invalid category ID");
    const developeryExists = await User.findById(developerId);
    if (!developeryExists) return response(res, false, "Invalid developer ID");

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

    const newTool = new Tool({
      toolName,
      logo: logoUrl,
      category,
      description,
      pricingType,
      websiteUrl,
      demoVideoUrl,
      tags: tags ? JSON.parse(tags) : [],
      features: features ? JSON.parse(features) : [],
      screenshots: screenshotUrls,
      developerId,
      created_by: developerId,
    });

    await newTool.save();

    return response(res, true, "Tool created successfully", newTool);
  } catch (error) {
    console.error("Error creating tool:", error);
    return response(res, false, "Error creating tool", error.message);
  }
};

const getAllTools = async (req, res) => {
  try {
    let { 
      page = 1, 
      limit = 10, 
      search = "", 
      category, 
      developerId,
      sort = -1, 
      sortingFor = "createdAt" 
    } = req.query;

    page = parseInt(page);
    limit = parseInt(limit);


    let filter = {};

    if (search) {
      filter.toolName = { $regex: search, $options: "i" }; 
    }

    if (category) filter.category = category;
    if (developerId) filter.developerId = developerId;

    const totalCount = await Tool.countDocuments(filter);


    const tools = await Tool.find(filter)
      .populate("category", "name")
      .populate("developerId", "name email")
      .sort({ [sortingFor]: sort })
      .skip((page - 1) * limit)
      .limit(limit);

    if (!tools.length) {
      return response(res, false, "No tools found");
    }

    return response(res, true, "Tools fetched successfully", {
      list: tools,
      currentPage: page,
      totalPages: Math.ceil(totalCount / limit),
      totalCount,
    });
  } catch (error) {
    console.error("Error fetching tools:", error);
    return response(res, false, "Error fetching tools", error.message);
  }
};

module.exports = { createTool, getAllTools };
