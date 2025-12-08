const bcrypt = require("bcryptjs");
const User = require("../models/User");
const { response } = require("../common/response/response");
const Admin = require("../models/AdminUser")
const Tool = require("../models/Tolls");

const getAllUsers = async (req, res) => {
  try {
    const { userType } = req.body; 

    let filter = {};
    if (userType) {
      filter.userType = userType;
    }

    const users = await User.find(filter)
      .select("-password -token -tokenExpiry") 
      .sort({ createdAt: -1 }); 

    if (!users.length) {
      return response(res, false, "No users found");
    }

    return response(res, true, "Users fetched successfully", users);
  } catch (error) {
    console.error(error);
    return response(res, false, error.message);
  }
};

const getUserById = async (req, res) => {
  try {
    const { id } = req.body;

    if (!id) return response(res, false, "User ID is required");

    const user = await User.findById(id);
    const admin = await Admin.findById(id);

    if (!user && !admin) {
      return response(res, false, "User not found");
    }

    const result = {};
    if (user) result.user = user.toJSON();
    if (admin) result.admin = admin.toJSON();

    return response(res, true, "Data fetched successfully", result);
  } catch (error) {
    return response(res, false, error.message);
  }
};

const updateUser = async (req, res) => {
  try {
    const {
      id,
      firstName,
      lastName,
      email,
      companyEmail,
      companyName,
      companyWebsite,
      password,
      role,
      industry,
      country,
    } = req.body;

    if (!id) return response(res, false, "User ID is required");

    const user = await User.findById(id);
    if (!user) return response(res, false, "User not found");
    let updatedPassword = user.password;
    if (password) {
      updatedPassword = await bcrypt.hash(password, 10);
    }

    user.firstName = firstName || user.firstName;
    user.lastName = lastName || user.lastName;
    user.email = email || user.email;
    user.companyEmail = companyEmail || user.companyEmail;
    user.companyName = companyName || user.companyName;
    user.companyWebsite = companyWebsite || user.companyWebsite;
    user.password = updatedPassword;
    user.role = role || user.role;
    user.industry = industry || user.industry;
    user.country = country || user.country;
    user.updated_by = req.userId || null;

    await user.save();

    return response(res, true, "User updated successfully", user.toJSON());
  } catch (error) {
    return response(res, false, error.message);
  }
};

const deleteUser = async (req, res) => {
  try {
    const { userId, adminId } = req.body;

    if (!userId) return response(res, false, "User ID is required");
    if (!adminId) return response(res, false, "Admin ID is required");


    const admin = await User.findOne({
      _id: adminId,
      status: "Active",
      userType: "Admin",
    });
    if (!admin)
      return response(res, false, "Admin not found, inactive, or not authorized");

    const user = await User.findById(userId);
    if (!user) return response(res, false, "User not found");

   
    user.status = "Deleted";
    user.updated_by = adminId;
    await user.save();

 
    const updatedTools = await Tool.updateMany(
      { userId: userId },
      { $set: { status: "Rejected", updated_by: adminId } }
    );

    return response(res, true, "User deleted successfully", {
      user: user.toJSON(),
      affectedTools: updatedTools.modifiedCount,
    });
  } catch (error) {
    console.error(error);
    return response(res, false, error.message);
  }
};


module.exports = {  getAllUsers,getUserById, updateUser,deleteUser };