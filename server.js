const express = require("express");
const mongoose = require("mongoose");
require("dotenv").config();

const app = express();

MONGO_URI="mongodb+srv://chinmaymahantacm_db_user:AxpGl5ErfI9X6GQJ@aihub.k7injzq.mongodb.net/aihub?retryWrites=true&w=majority"
PORT=4000

mongoose
  .connect(MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => console.log("✅ MongoDB connected"))
  .catch((err) => console.error("❌ MongoDB connection error:", err));

//comment added
app.get("/", (req, res) => {
  res.json({ status: 200, message: "Hello World Updated Again" });
});


app.listen(8080, () => {
  console.log("Server is running on port 8080");
});