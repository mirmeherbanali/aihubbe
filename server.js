const express = require("express");
const mongoose = require("mongoose");
require("dotenv").config();

const app = express();
app.use(express.json());

const MONGO_URI = process.env.MONGO_URI || "mongodb://admin:admin@host.docker.internal:27017/aihub";
const PORT = process.env.PORT || 8080;

let mongoStatus = "Disconnected";

mongoose
  .connect(MONGO_URI)
  .then(() => {
    mongoStatus = "Connected ✅";
    console.log("✅ MongoDB connected");
  })
  .catch((err) => {
    mongoStatus = "Connection Failed ❌";
    console.error("❌ MongoDB connection error:", err);
  });

const itemSchema = new mongoose.Schema({
  name: { type: String, required: true },
  description: String,
  createdAt: { type: Date, default: Date.now },
});

const Item = mongoose.model("Item", itemSchema);

app.get("/", (req, res) => {
  console.log("inside root route");
  res.json({ status: 200, message: `Data: ${mongoStatus}` });
});

app.get("/items", async (req, res) => {
  console.log("inside items route");
  try {
    console.log("before fetch");
    const items = await Item.find().sort({ createdAt: -1 });
    console.log("after fetch");
    res.json({ status: 200, data: items });
  } catch (err) {
    console.error("Error fetching items:", err);
    res.status(500).json({ status: 500, message: "Internal Server Error" });
  }
});

// Optional: POST route to add items
app.post("/items", async (req, res) => {
  try {
    const item = new Item({
      name: req.body.name,
      description: req.body.description,
    });
    await item.save();
    res.json({ status: 200, data: item });
  } catch (err) {
    console.error("Error creating item:", err);
    res.status(500).json({ status: 500, message: "Internal Server Error" });
  }
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
