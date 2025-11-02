const mongoose = require("mongoose");

const connectDb = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("Database Connected");
  } catch (error) {
    console.error("Error message:", error.message);
    console.error("Stack trace:", error.stack);
    process.exit(1);
  }
};
module.exports = connectDb;
