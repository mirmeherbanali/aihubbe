const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    firstName: { type: String, required: true, trim: true },
    lastName: { type: String, required: true, trim: true },
    email: {type: String,trim: true,lowercase: true},
    password: { type: String, trim: true, required: true },
    userType: { type: String, enum: ["Admin", "Reviewer", "Developer"], default: "Reviewer" },
    companyName: { type: String },
    companyWebsite: { type: String },
    companyEmail: {type: String,trim: true,lowercase: true,sparse: true,},
    role: { type: String, trim: true },
    industry: { type: String, trim: true },
    country: { type: String, trim: true },
    status: { type: String, enum: ["Active", "Inactive", "Deleted"], default: "Active" },
    token: { type: String },
    tokenExpiry: { type: Date },
    created_by: {type: mongoose.Schema.Types.ObjectId,ref: "User",default: null,},
    updated_by: {type: mongoose.Schema.Types.ObjectId,ref: "User",default: null,},
  },
  { timestamps: true }
);

userSchema.methods.toJSON = function () {
  const obj = this.toObject();
  delete obj.password;
  delete obj.token;
  delete obj.tokenExpiry;
  return obj;
};

module.exports = mongoose.model("User", userSchema, "user");
