const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/User");
const { response } = require("../common/response/response");
const getTokenFromRequest = require("../utils/getToken");
const Admin = require("../models/AdminUser");

const register = async (req, res) => {
  try {
    const {
      userType,
      firstName,
      lastName,
      companyName,
      companyEmail,
      companyWebsite,
      email,
      password,
    } = req.body;

    if (!userType) {
      return response(res, false, "userType is required");
    }

    let existingUser;

    if (userType === "Reviewer") {
      existingUser = await User.findOne({ email });
    } else if (userType === "Developer") {
      existingUser = await User.findOne({ companyEmail });
    } else if (userType === "Admin") {
      existingUser = await User.findOne({ email });
    }

    if (existingUser) {
      return response(res, false, "User already exists");
    }
    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = new User({
      userType,
      firstName,
      lastName,
      email,
      companyName,
      companyEmail,
      companyWebsite,
      status: "Active",
      password: hashedPassword,
    });

    await newUser.save();

    return response(res, true, "User registered successfully", newUser.toJSON());
  } catch (error) {
    console.error(error);
    return response(res, false, error.message);
  }
};


const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email) return response(res, false, "Email is required");
    if (!password) return response(res, false, "Password is required");

    let user = null;
    let isAdminLogin = false;
    user = await User.findOne({
      $or: [{ email: email }, { companyEmail: email }],
    });
    if (!user) {
      user = await Admin.findOne({ email: email });
      isAdminLogin = !!user;
    }

    if (!user) {
      return response(res, false, "User not found");
    }

    if (user.status && user.status !== "Active") {
      return response(res, false, "User is not active");
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return response(res, false, "Invalid credentials");

    const token = jwt.sign(
      { id: user._id, isAdmin: isAdminLogin },
      process.env.JWT_SECRET_KEY,
      { expiresIn: "1d" }
    );

    user.token = token;
    user.tokenExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000);
    await user.save();
    return response(res, true, "Login successful", {
      token,
      user: user.toJSON(),
      isAdmin: isAdminLogin,
    });

  } catch (error) {
    console.error("Login Error:", error);
    return response(res, false, error.message);
  }
};


const logout = async (req, res) => {
  try {
    const token = getTokenFromRequest(req);
    if (!token) return response(res, false, "Token not provided");

    const user = await User.findOne({ token });
    if (!user) return response(res, false, "Invalid token");

    user.token = null;
    user.tokenExpiry = null;
    await user.save();

    return response(res, true, "Logged out successfully");
  } catch (error) {
    return response(res, false, error.message);
  }
};

module.exports = { register, login, logout };
