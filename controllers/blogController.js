const AWS = require("aws-sdk");
const Blog = require("../models/Blog");
const Category = require("../models/BlogCategory");
const User = require("../models/User");
const Admin = require("../models/AdminUser");
const { response } = require("../common/response/response");

const s3 = new AWS.S3({
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
});

const uploadToS3 = async (file, folder = "blogs") => {
  const params = {
    Bucket: process.env.AWS_BUCKET_NAME,
    Key: `${folder}/${Date.now()}_${file.originalname}`,
    Body: file.buffer,
    ContentType: file.mimetype,
  };

  const upload = await s3.upload(params).promise();
  return upload.Location;
};


const validateBlogCreator = async (userId) => {
  const user = await User.findById(userId);
  if (user && ["Admin", "Developer"].includes(user.userType)) return true;

  const adminUser = await Admin.findById(userId);
  if (adminUser && adminUser.userType === "AdminUser") return true;

  return false;
};

const createBlog = async (req, res) => {
  try {
    let {
      blogTitle,
      slug,
      content,
      shortDescription,
      metaDescription,
      categories,
      author,
      status,
      publishedDate,
      jsonLdSchema,
      userId,
      featuredImageAltText,
      featuredImageTitleText,
    } = req.body;

    if (!blogTitle) return response(res, false, "Blog title is required");
    if (!content) return response(res, false, "Blog content is required");
    if (!categories) return response(res, false, "Category is required");
    if (!author) return response(res, false, "Author is required");
    if (!userId) return response(res, false, "userId is required");

    const canCreate = await validateBlogCreator(userId);
    if (!canCreate)
      return response(res, false, "Permission denied");

    if (typeof categories === "string") {
      categories = JSON.parse(categories);
    }

    const categoryDocs = await Category.find({ _id: { $in: categories } });
    if (categoryDocs.length !== categories.length) {
      return response(res, false, "Invalid category IDs");
    }

    let featuredImage = null;

    if (req.files?.featuredImage?.[0]) {
      const imageUrl = await uploadToS3(
        req.files.featuredImage[0],
        "blog-images"
      );

      featuredImage = {
        url: imageUrl,
        altText: featuredImageAltText || blogTitle,
        titleText: featuredImageTitleText || blogTitle,
      };
    }

    const blog = new Blog({
      blogTitle,
      slug,
      content,
      shortDescription,
      metaDescription,
      categories,
      author,
      status,
      publishedDate: status === "Published" ? publishedDate || new Date() : null,
      lastModifiedDate: new Date(),
      jsonLdSchema,
      featuredImage,
      created_by: userId,
    });

    await blog.save();

    return response(res, true, "Blog created successfully", blog);
  } catch (error) {
    console.error(error);
    return response(res, false, "Error creating blog", error.message);
  }
};


const updateBlog = async (req, res) => {
  try {
    const {
      id,
      userId,
      status,
      featuredImageAltText,
      featuredImageTitleText,
    } = req.body;

    if (!id) return response(res, false, "Blog ID is required");

    const blog = await Blog.findById(id);
    if (!blog) return response(res, false, "Blog not found");

    const canUpdate = await validateBlogCreator(userId);
    if (!canUpdate)
      return response(res, false, "Permission denied");

    if (req.files?.featuredImage?.[0]) {
      const imageUrl = await uploadToS3(
        req.files.featuredImage[0],
        "blog-images"
      );

      blog.featuredImage = {
        url: imageUrl,
        altText: featuredImageAltText || blog.blogTitle,
        titleText: featuredImageTitleText || blog.blogTitle,
      };
    }

    Object.assign(blog, req.body);
    blog.updated_by = userId;
    blog.lastModifiedDate = new Date();

    if (status === "Published" && !blog.publishedDate) {
      blog.publishedDate = new Date();
    }

    await blog.save();

    return response(res, true, "Blog updated successfully", blog);
  } catch (error) {
    return response(res, false, "Error updating blog", error.message);
  }
};


const getAllBlogs = async (req, res) => {
  const { search, status, currentPage = 1, limit = 10 } = req.body;

  try {
    let filter = {};

    if (status) filter.status = status;
    if (search) {
      filter.blogTitle = { $regex: search, $options: "i" };
    }

    const totalCount = await Blog.countDocuments(filter);

    const blogs = await Blog.find(filter)
      .populate("author", "firstName lastName")
      .populate("categories", "categoryName")
      .sort({ createdAt: -1 })
      .skip((currentPage - 1) * limit)
      .limit(limit)
      .lean();

    return response(
      res,
      true,
      "Blogs fetched successfully",
      blogs,
      totalCount
    );
  } catch (error) {
    return response(res, false, error.message);
  }
};


const getBlogById = async (req, res) => {
  const { id } = req.body;

  if (!id) return response(res, false, "Blog ID is required");

  const blog = await Blog.findById(id)
    .populate("author", "firstName lastName")
    .populate("categories", "categoryName")
    .lean();

  if (!blog) return response(res, false, "Blog not found");

  return response(res, true, "Blog fetched successfully", blog);
};


const deleteBlog = async (req, res) => {
  const { id, adminId } = req.body;

  if (!id || !adminId)
    return response(res, false, "Blog ID and Admin ID required");

  const adminExists =
    (await Admin.findById(adminId)) || (await User.findById(adminId));

  if (!adminExists)
    return response(res, false, "Permission denied");

  await Blog.findByIdAndDelete(id);

  return response(res, true, "Blog deleted successfully");
};


module.exports = {
  createBlog,
  updateBlog,
  getAllBlogs,
  getBlogById,
  deleteBlog,
};
