const mongoose = require("mongoose");

const adminUserSchema = new mongoose.Schema(
  {
    firstName: { type: String, required: true, trim: true },
    lastName: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    password: { type: String, required: true },
    adminId: { type: mongoose.Schema.Types.ObjectId, ref: "Admin", default: null },
    userType: { type: String, enum: ["AdminUser"], default: "AdminUser" },
    status: { type: String, enum: ["Active", "Inactive","Deleted"], default: "Active" },
  },
  { timestamps: true }
);

adminUserSchema.methods.toJSON = function () {
  const obj = this.toObject();
  delete obj.password;
  return obj;
};

module.exports = mongoose.model("Admin", adminUserSchema, "admin");
