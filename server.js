const express = require("express");
const mongoose = require("mongoose");
require("dotenv").config();

const app = express();

const MONGO_URI = process.env.MONGO_URI || "mongodb://admin:admin@98.89.29.192";

const PORT = process.env.PORT || 4000;

// Connection status flag
let mongoStatus = "Disconnected";

// Connect to MongoDB
mongoose
  .connect(MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => {
    mongoStatus = "Connected ✅";
    console.log("✅ MongoDB connected");
  })
  .catch((err) => {
    mongoStatus = "Connection Failed ❌";
    console.error("❌ MongoDB connection error:", err);
  });

//comment added
app.get("/", (req, res) => {
  res.json({ status: 200, message: "Hello Dinesh" });
});

app.listen(8080, () => {
  console.log("Server is running on port 8080");
});
