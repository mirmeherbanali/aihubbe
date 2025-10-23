const express = require("express");
const mongoose = require("mongoose");
require("dotenv").config();

const app = express();
app.use(express.json());

// Environment variables
const MONGO_URI =
  process.env.MONGO_URI ||
  "mongodb://admin:admin@98.89.29.192";
  // process.env.MONGO_URI ||
  // "mongodb+srv://chinmaymahantacm_db_user:AxpGl5ErfI9X6GQJ@aihub.k7injzq.mongodb.net/aihub?retryWrites=true&w=majority";
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

// Define schema and model
const itemSchema = new mongoose.Schema({
  name: { type: String, required: true },
  description: String,
  createdAt: { type: Date, default: Date.now },
});

const Item = mongoose.model("Item", itemSchema);

// Root route
// app.get("/", (req, res) => {
//   res.send(`
//     <div style="font-family: Arial; text-align: center; margin-top: 50px;">
//       <h1>🚀 Server is Running!</h1>
//       <h2>MongoDB Status: <span style="color: ${
//         mongoStatus.includes("Connected") ? "green" : "red"
//       };">${mongoStatus}</span></h2>
//       <p>Time: ${new Date().toLocaleString()}</p>
//     </div>
//   `);
// });

app.get("/", (req, res) => {
  res.json({ status: 200, message: `Data: ${mongoStatus}` });
});

// Start server
app.listen(PORT, "0.0.0.0", () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
