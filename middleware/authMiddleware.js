const jwt = require("jsonwebtoken");
const User = require("../models/User");
const { response } = require("../common/response/response");
const getTokenFromRequest = require("../utils/getToken");

const checkAuth = async (req, res, next) => {
  try {
    const token = getTokenFromRequest(req);
    if (!token) return response(res, false, "Authentication token not provided");

    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET_KEY);
    } catch (err) {
      return response(res, false, "Invalid or expired token");
    }

    const userId = decoded.id || decoded.user_id || decoded._id;
    if (!userId) return response(res, false, "Invalid token payload");

    const user = await User.findById(userId).select("-password");
    if (!user) return response(res, false, "User not found");

    if (!user.token || user.token !== token || new Date(user.tokenExpiry) < new Date()) {
      user.token = null;
      user.tokenExpiry = null;
      await user.save();
      return response(res, false, "Token expired or invalid");
    }

    req.user = user;
    req.token = token;
    next();
  } catch (error) {
    return response(res, false, error.message);
  }
};

module.exports = checkAuth;
