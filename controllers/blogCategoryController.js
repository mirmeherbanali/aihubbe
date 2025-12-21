const BlogCategory = require("../models/BlogCategory");
const { response } = require("../common/response/response");


const createBlogCategory = async (req, res) => {
  try {
    const { categoryName } = req.body;

    if (!categoryName)
      return response(res, false, "Category name is required");

    const exists = await BlogCategory.findOne({ categoryName });
    if (exists)
      return response(res, false, "Category already exists");

    const category = await BlogCategory.create({ categoryName });

    return response(
      res,
      true,
      "Blog category created successfully",
      category
    );
  } catch (error) {
    return response(res, false, "Error creating category", error.message);
  }
};


const getAllBlogCategories = async (req, res) => {
  try {
    const categories = await BlogCategory.find()
      .sort({ createdAt: -1 })
      .lean();

    return response(
      res,
      true,
      "Blog categories fetched successfully",
      categories
    );
  } catch (error) {
    return response(res, false, error.message);
  }
};


const updateBlogCategory = async (req, res) => {
  try {
    const { id, categoryName } = req.body;

    if (!id) return response(res, false, "Category ID is required");
    if (!categoryName)
      return response(res, false, "Category name is required");

    const exists = await BlogCategory.findOne({
      categoryName,
      _id: { $ne: id },
    });

    if (exists)
      return response(res, false, "Category name already exists");

    const category = await BlogCategory.findByIdAndUpdate(
      id,
      { categoryName },
      { new: true }
    );

    if (!category)
      return response(res, false, "Category not found");

    return response(
      res,
      true,
      "Blog category updated successfully",
      category
    );
  } catch (error) {
    return response(res, false, "Error updating category", error.message);
  }
};


const deleteBlogCategory = async (req, res) => {
  try {
    const { id } = req.body;

    if (!id) return response(res, false, "Category ID is required");

    const category = await BlogCategory.findByIdAndDelete(id);
    if (!category)
      return response(res, false, "Category not found");

    return response(
      res,
      true,
      "Blog category deleted successfully"
    );
  } catch (error) {
    return response(res, false, "Error deleting category", error.message);
  }
};

module.exports = {
  createBlogCategory,
  getAllBlogCategories,
  updateBlogCategory,
  deleteBlogCategory,
};
