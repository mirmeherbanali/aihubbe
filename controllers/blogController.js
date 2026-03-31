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
      metaRobots,
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
    if (!canCreate) return response(res, false, "Permission denied");

    if (typeof categories === "string") {
      try {
        categories = categories.startsWith("[")
          ? JSON.parse(categories)
          : [categories];
      } catch (e) {
        return response(res, false, "Invalid categories format");
      }
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
      publishedDate:
        status === "Published" ? publishedDate || new Date() : null,
      lastModifiedDate: new Date(),
      jsonLdSchema,
       metaRobots: metaRobots || "index, follow", 
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
    let {
      id,
      userId,
      status,
      categories,
      featuredImageAltText,
      featuredImageTitleText,
      blogTitle,
      slug,
      content,
      shortDescription,
      metaDescription,
      jsonLdSchema,
      metaRobots,
    } = req.body;

    if (!id) return response(res, false, "Blog ID is required");
    if (!userId) return response(res, false, "userId is required");

    const blog = await Blog.findById(id);
    if (!blog) return response(res, false, "Blog not found");

    const canUpdate = await validateBlogCreator(userId);
    if (!canUpdate) return response(res, false, "Permission denied");

    if (categories) {
      if (typeof categories === "string") {
        try {
          categories = categories.startsWith("[")
            ? JSON.parse(categories)
            : [categories];
        } catch (e) {
          return response(res, false, "Invalid categories format");
        }
      }

      blog.categories = categories;
    }

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

    if (blogTitle) blog.blogTitle = blogTitle;
    if (slug) blog.slug = slug;
    if (content) blog.content = content;
    if (shortDescription) blog.shortDescription = shortDescription;
    if (metaDescription) blog.metaDescription = metaDescription;
    if (jsonLdSchema) blog.jsonLdSchema = jsonLdSchema;
    if (metaRobots) blog.metaRobots = metaRobots;
    if (status) blog.status = status;

    if (status === "Published" && !blog.publishedDate) {
      blog.publishedDate = new Date();
    }

    blog.updated_by = userId;
    blog.lastModifiedDate = new Date();

    await blog.save();

    return response(res, true, "Blog updated successfully", blog);
  } catch (error) {
    console.error(error);
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
      .populate("author", "authorName authorBio authorImage socialLinks")
      .populate("categories", "categoryName")
      .sort({ createdAt: -1 })
      .skip((currentPage - 1) * limit)
      .limit(limit)
      .lean();

    return response(res, true, "Blogs fetched successfully", blogs, totalCount);
  } catch (error) {
    return response(res, false, error.message);
  }
};
// const getAllBlogsUnique = async (req, res) => {
//   const { search, status } = req.body;

//   try {
//     let filter = {};

//     if (status) filter.status = status;

//     if (search) {
//       filter.blogTitle = { $regex: search, $options: "i" };
//     }

//     const blogs = await Blog.find(filter)
//       .populate("author", "authorName authorBio authorImage socialLinks")
//       .populate("categories", "categoryName")
//       .sort({ createdAt: -1 }) 
//       .lean();
//     let flattenedBlogs = [];

//     blogs.forEach((blog) => {
//       if (blog.categories && blog.categories.length > 0) {
//         blog.categories.forEach((cat) => {
//           const { categories, ...rest } = blog;

//           flattenedBlogs.push({
//             ...rest,
//             category: cat,
//           });
//         });
//       } else {
//         flattenedBlogs.push({
//           ...blog,
//           category: null,
//         });
//       }
//     });

//     const uniqueMap = new Map();

//     flattenedBlogs.forEach((item) => {
//       if (!uniqueMap.has(item.blogTitle)) {
//         uniqueMap.set(item.blogTitle, item);
//       }
//     });

//     const uniqueBlogs = Array.from(uniqueMap.values());
//     const finalBlogs = uniqueBlogs.slice(0, 4);

  
//     return response(
//       res,
//       true,
//       "blogs fetched successfully",
//       finalBlogs,
//       finalBlogs.length
//     );
//   } catch (error) {
//     console.error("Error in getAllBlogsUnique:", error);
//     return response(res, false, error.message);
//   }
// };
// const getBlogById = async (req, res) => {
//   const { id } = req.body;

//   if (!id) return response(res, false, "Blog ID is required");

//   const blog = await Blog.findById(id)
//     .populate("author", "firstName lastName")
//     .populate("categories", "categoryName")
//     .lean();

//   if (!blog) return response(res, false, "Blog not found");

//   return response(res, true, "Blog fetched successfully", blog);
// };
// const getBlogById = async (req, res) => {
//   try {
//     const { id, categoryName } = req.body;

//     if (!id) return response(res, false, "Blog ID is required");

//     // 1. Get main blog
//     const blog = await Blog.findById(id)
//       .populate("author", "firstName lastName")
//       .populate("categories", "categoryName")
//       .lean();

//     if (!blog) return response(res, false, "Blog not found");

//     let categoryFilterIds = [];

//     // 2. If categoryName is passed → find matching categoryId
//     if (categoryName) {
//       const matchedCategory = blog.categories.find(
//         cat => cat.categoryName === categoryName
//       );

//       if (matchedCategory) {
//         categoryFilterIds.push(matchedCategory._id);
//       }
//     } else {
//       // fallback → all categories
//       categoryFilterIds = blog.categories.map(cat => cat._id);
//     }

//     // 3. Related Articles
//     let relatedArticles = await Blog.find({
//       _id: { $ne: id },
//       categories: { $in: categoryFilterIds },
//       status: "Published",
//     })
//       .populate("author", "firstName lastName")
//       .populate("categories", "categoryName")
//       .select("blogTitle slug featuredImage createdAt author categories")
//       .sort({ createdAt: -1 })
//       .limit(5)
//       .lean();

//     // 4. Show only matched category in response
//     relatedArticles = relatedArticles.map(article => ({
//       ...article,
//       categories: article.categories.filter(cat =>
//         categoryFilterIds.some(id => id.toString() === cat._id.toString())
//       )
//     }));

//     return response(res, true, "Blog fetched successfully", {
//       blog,
//       relatedArticles,
//     });

//   } catch (error) {
//     return response(res, false, error.message);
//   }
// };
const getAllBlogsUnique = async (req, res) => {
  try {
    const blogs = await Blog.find({ status: "Published" })
      .populate("author", "authorName authorBio authorImage socialLinks")
      .populate("categories", "categoryName")
      .sort({ createdAt: -1 }) 
      .limit(4) 
      .lean();

    return response(res, true, "Latest blogs fetched successfully", blogs);
  } catch (error) {
    return response(res, false, error.message);
  }
};
const getBlogById = async (req, res) => {
  try {
    const { id, categoryName } = req.body;

    if (!id) return response(res, false, "Blog ID is required");
    const blog = await Blog.findById(id)
      .populate("author", "authorName")
      .populate("categories", "categoryName")
      .lean();

    if (!blog) return response(res, false, "Blog not found");

    let categoryFilterIds = [];

    if (categoryName) {
      const matchedCategory = blog.categories.find(
        cat => cat.categoryName.toLowerCase() === categoryName.toLowerCase()
      );

      if (matchedCategory) {
        categoryFilterIds.push(matchedCategory._id);
      }
    } else {
      categoryFilterIds = blog.categories.map(cat => cat._id);
    }


    let relatedArticles = await Blog.find({
      _id: { $ne: id },
      categories: { $in: categoryFilterIds },
      status: "Published",
    })
      .populate("author", "authorName")
      .populate("categories", "categoryName")
      .select("blogTitle slug featuredImage createdAt author categories")
      .sort({ createdAt: -1 })
      .limit(5)
      .lean();

  
    relatedArticles = relatedArticles.map(article => ({
      ...article,
      categories: article.categories.filter(cat =>
        categoryFilterIds.some(id => id.toString() === cat._id.toString())
      )
    }));

   
    const latestArticle = await Blog.find({
      _id: { $ne: id },
      status: "Published",
    })
      .populate("author", "authorName")
      .populate("categories", "categoryName")
      .select("blogTitle slug featuredImage createdAt author categories")
      .sort({ createdAt: -1 }) 
      .limit(4) 
      .lean();

    
    return response(res, true, "Blog fetched successfully", {
      blog,
      relatedArticles,
      latestArticle, 
    });

  } catch (error) {
    return response(res, false, error.message);
  }
};
const deleteBlog = async (req, res) => {
  const { id, adminId } = req.body;

  if (!id || !adminId)
    return response(res, false, "Blog ID and Admin ID required");

  const adminExists =
    (await Admin.findById(adminId)) || (await User.findById(adminId));

  if (!adminExists) return response(res, false, "Permission denied");

  await Blog.findByIdAndDelete(id);

  return response(res, true, "Blog deleted successfully");
};
const getBlogsByCategory = async (req, res) => {
  try {
    let {
      categoryId,
      search,
      status = "Published",
      currentPage = 1,
      limit = 10,
    } = req.body;

    if (!categoryId) return response(res, false, "Category ID is required");
    const category = await Category.findById(categoryId);
    if (!category) return response(res, false, "Category not found");

    let filter = {
      categories: categoryId,
    };

    if (status) filter.status = status;

    if (search) {
      filter.blogTitle = { $regex: search, $options: "i" };
    }

    const totalCount = await Blog.countDocuments(filter);

    const blogs = await Blog.find(filter)
      .populate("author", "authorName authorBio authorImage socialLinks")
      .populate("categories", "categoryName")
      .sort({ createdAt: -1 })
      .skip((currentPage - 1) * limit)
      .limit(Number(limit))
      .lean();

    return response(res, true, "Blogs fetched successfully", blogs, totalCount);
  } catch (error) {
    console.error(error);
    return response(res, false, "Error fetching blogs", error.message);
  }
};
const getBlogBySlug = async (req, res) => {
  try {
    const { slug, categoryName } = req.body;

    if (!slug) return response(res, false, "Slug is required");

    /* 🔥 FIND BLOG BY SLUG */
    const blog = await Blog.findOne({
      slug: slug,
      status: "Published",
    })
      .populate("author", "authorName")
      .populate("categories", "categoryName")
      .lean();

    if (!blog) return response(res, false, "Blog not found");

    /* 🔥 CATEGORY FILTER */
    let categoryFilterIds = [];

    if (categoryName) {
      const matchedCategory = blog.categories.find(
        (cat) =>
          cat.categoryName.toLowerCase() === categoryName.toLowerCase()
      );

      if (matchedCategory) {
        categoryFilterIds.push(matchedCategory._id);
      }
    } else {
      categoryFilterIds = blog.categories.map((cat) => cat._id);
    }

    /* 🔥 RELATED */
    let relatedArticles = await Blog.find({
      _id: { $ne: blog._id },
      categories: { $in: categoryFilterIds },
      status: "Published",
    })
      .populate("author", "authorName")
      .populate("categories", "categoryName")
      .select("blogTitle slug featuredImage createdAt author categories")
      .sort({ createdAt: -1 })
      .limit(5)
      .lean();

    /* 🔥 FILTER CATEGORY */
    relatedArticles = relatedArticles.map((article) => ({
      ...article,
      categories: article.categories.filter((cat) =>
        categoryFilterIds.some(
          (id) => id.toString() === cat._id.toString()
        )
      ),
    }));

    /* 🔥 LATEST */
    const latestArticle = await Blog.find({
      _id: { $ne: blog._id },
      status: "Published",
    })
      .populate("author", "authorName")
      .populate("categories", "categoryName")
      .select("blogTitle slug featuredImage createdAt author categories")
      .sort({ createdAt: -1 })
      .limit(4)
      .lean();

    return response(res, true, "Blog fetched successfully", {
      blog,
      relatedArticles,
      latestArticle,
    });
  } catch (error) {
    return response(res, false, error.message);
  }
};
module.exports = {
  createBlog,
  updateBlog,
  getAllBlogs,
  getBlogById,
  deleteBlog,
  getBlogsByCategory,
<<<<<<< HEAD
  getAllBlogsUnique
  
=======
  getAllBlogsUnique,
  getBlogBySlug,
>>>>>>> 830ac21 (done for blog)
};
