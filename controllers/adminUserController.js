const bcrypt = require("bcryptjs");
const Admin = require("../models/AdminUser");
const User = require("../models/User");
const { response } = require("../common/response/response");

const addAdminUser = async (req, res) => {
  try {
    const { userType, firstName, lastName, email, password, adminId } =
      req.body;

    if (!userType) {
      return response(res, false, "userType is required");
    }
    if (!email) {
      return response(res, false, "Email must be provided");
    }
    if (!password) {
      return response(res, false, "password must be provided");
    }
    if (!adminId) {
      return response(res, false, "adminId is required");
    }

    const existingAdmin = await Admin.findOne({ email });
    if (existingAdmin) {
      return response(res, false, "Admin with this email already exists");
    }

    if (adminId) {
      const user = await User.findById(adminId);
      if (!user || user.userType !== "Admin") {
        return response(
          res,
          false,
          "adminId must belong to a User with userType 'Admin'"
        );
      }
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const admin = await Admin.create({
      firstName,
      lastName,
      email,
      password: hashedPassword,
      adminId,
      status: "Active",
      userType: userType,
    });

    return response(res, true, "Admin created successfully", admin);
  } catch (error) {
    return response(res, false, error.message);
  }
};

const updateAdminUser = async (req, res) => {
  try {
    const { adminId, firstName, lastName, email, password } = req.body;

    if (!adminId) {
      return response(res, false, "adminId is required");
    }

    const admin = await Admin.findById(adminId);
    if (!admin) {
      return response(res, false, "Admin User not found");
    }

    let hashedPassword = admin.password;
    if (password) {
      hashedPassword = await bcrypt.hash(password, 10);
    }

    admin.firstName = firstName || admin.firstName;
    admin.lastName = lastName || admin.lastName;
    admin.email = email || admin.email;
    admin.password = hashedPassword;
    await admin.save();

    return response(res, true, "Admin User updated successfully", admin);
  } catch (error) {
    return response(res, false, error.message);
  }
};

const deleteAdminUser = async (req, res) => {
  try {
    const { adminId, targetAdminId } = req.body;

    if (!adminId)
      return response(res, false, "adminId (requester) is required");
    if (!targetAdminId)
      return response(res, false, "targetAdminId (user to delete) is required");

    const requester = await Admin.findById(adminId);
    if (!requester) return response(res, false, "Requester Admin not found");

    if (requester.userType !== "Admin") {
      return response(res, false, "Only Admin can delete");
    }
    const target = await Admin.findById(targetAdminId);
    if (!target) return response(res, false, "Admin User to delete not found");

    if (target.userType === "Admin") {
      return response(res, false, "You cannot delete another Admin");
    }
    target.status = "Deleted";
    await target.save();

    return response(res, true, "Admin User deleted successfully");
  } catch (error) {
    return response(res, false, error.message);
  }
};

module.exports = {
  addAdminUser,
  updateAdminUser,
  deleteAdminUser,
};
