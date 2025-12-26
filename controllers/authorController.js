const AWS = require("aws-sdk");
const Author = require("../models/Author");
const { response } = require("../common/response/response");

const s3 = new AWS.S3({
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
});

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

const createAuthor = async (req, res) => {
  try {
    const { authorName, authorBio, socialLinks } = req.body;

    if (!authorName) {
      return response(res, false, "Author name is required");
    }

    const existingAuthor = await Author.findOne({
      authorName: { $regex: `^${authorName}$`, $options: "i" },
    });

    if (existingAuthor) {
      return response(res, false, "Author already exists");
    }

    const parsedSocialLinks = Array.isArray(socialLinks)
      ? socialLinks
      : socialLinks
      ? [socialLinks]
      : [];

    let authorImage = null;

    if (req.files?.authorImage?.[0]) {
      authorImage = await uploadToS3(req.files.authorImage[0], "authors");
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

const getAllAuthors = async (req, res) => {
  try {
    const authors = await Author.find().sort({ createdAt: -1 }).lean();

    return response(res, true, "Authors fetched successfully", authors);
  } catch (error) {
    return response(res, false, error.message);
  }
};

const getAuthorById = async (req, res) => {
  const { id } = req.body;

  if (!id) return response(res, false, "Author ID is required");

  const author = await Author.findById(id).lean();
  if (!author) return response(res, false, "Author not found");

  return response(res, true, "Author fetched successfully", author);
};

const updateAuthor = async (req, res) => {
  try {
    const { id, authorName, authorBio, socialLinks } = req.body;

    if (!id) {
      return response(res, false, "Author ID is required");
    }

    const author = await Author.findById(id);
    if (!author) {
      return response(res, false, "Author not found");
    }

    if (authorName && authorName !== author.authorName) {
      const existingAuthor = await Author.findOne({
        _id: { $ne: id },
        authorName: { $regex: `^${authorName}$`, $options: "i" },
      });

      if (existingAuthor) {
        return response(res, false, "Author name already exists");
      }

      author.authorName = authorName;
    }

    if (authorBio) {
      author.authorBio = authorBio;
    }

    if (socialLinks !== undefined) {
      author.socialLinks = Array.isArray(socialLinks)
        ? socialLinks
        : socialLinks
        ? [socialLinks]
        : [];
    }

    if (req.files?.authorImage?.[0]) {
      author.authorImage = await uploadToS3(
        req.files.authorImage[0],
        "authors"
      );
    }

    await author.save();

    return response(res, true, "Author updated successfully", author);
  } catch (error) {
    return response(res, false, "Error updating author", error.message);
  }
};

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
