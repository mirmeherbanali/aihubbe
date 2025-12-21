const AWS = require("aws-sdk");
const Author = require("../models/Author");
const { response } = require("../common/response/response");

/* ==========================
   AWS S3 CONFIG
========================== */
const s3 = new AWS.S3({
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
});

/* ==========================
   Upload Helper
========================== */
const uploadToS3 = async (file, folder = "authors") => {
  const params = {
    Bucket: process.env.AWS_BUCKET_NAME,
    Key: `${folder}/${Date.now()}_${file.originalname}`,
    Body: file.buffer,
    ContentType: file.mimetype,
  };

  const upload = await s3.upload(params).promise();
  return upload.Location;
};

/* ==========================
   CREATE AUTHOR
========================== */
const createAuthor = async (req, res) => {
  try {
    const { authorName, authorBio, socialLinks } = req.body;

    if (!authorName)
      return response(res, false, "Author name is required");

    // socialLinks can come as JSON string or array
    const parsedSocialLinks =
      typeof socialLinks === "string"
        ? JSON.parse(socialLinks)
        : socialLinks || [];

    let authorImage = null;

    if (req.files?.authorImage?.[0]) {
      authorImage = await uploadToS3(
        req.files.authorImage[0],
        "authors"
      );
    }

    const author = new Author({
      authorName,
      authorBio,
      socialLinks: parsedSocialLinks,
      authorImage,
    });

    await author.save();

    return response(res, true, "Author created successfully", author);
  } catch (error) {
    return response(res, false, "Error creating author", error.message);
  }
};

/* ==========================
   GET ALL AUTHORS
========================== */
const getAllAuthors = async (req, res) => {
  try {
    const authors = await Author.find()
      .sort({ createdAt: -1 })
      .lean();

    return response(res, true, "Authors fetched successfully", authors);
  } catch (error) {
    return response(res, false, error.message);
  }
};

/* ==========================
   GET AUTHOR BY ID
========================== */
const getAuthorById = async (req, res) => {
  const { id } = req.body;

  if (!id) return response(res, false, "Author ID is required");

  const author = await Author.findById(id).lean();
  if (!author) return response(res, false, "Author not found");

  return response(res, true, "Author fetched successfully", author);
};

/* ==========================
   UPDATE AUTHOR
========================== */
const updateAuthor = async (req, res) => {
  try {
    const { id, authorName, authorBio, socialLinks } = req.body;

    if (!id) return response(res, false, "Author ID is required");

    const author = await Author.findById(id);
    if (!author) return response(res, false, "Author not found");

    if (req.files?.authorImage?.[0]) {
      author.authorImage = await uploadToS3(
        req.files.authorImage[0],
        "authors"
      );
    }

    if (authorName) author.authorName = authorName;
    if (authorBio) author.authorBio = authorBio;

    if (socialLinks) {
      author.socialLinks =
        typeof socialLinks === "string"
          ? JSON.parse(socialLinks)
          : socialLinks;
    }

    await author.save();

    return response(res, true, "Author updated successfully", author);
  } catch (error) {
    return response(res, false, "Error updating author", error.message);
  }
};

/* ==========================
   DELETE AUTHOR
========================== */
const deleteAuthor = async (req, res) => {
  try {
    const { id } = req.body;

    if (!id) return response(res, false, "Author ID is required");

    const author = await Author.findByIdAndDelete(id);
    if (!author) return response(res, false, "Author not found");

    return response(res, true, "Author deleted successfully");
  } catch (error) {
    return response(res, false, "Error deleting author", error.message);
  }
};

module.exports = {
  createAuthor,
  getAllAuthors,
  getAuthorById,
  updateAuthor,
  deleteAuthor,
};
