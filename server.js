const express = require("express");

const app = express();

//comment added
app.get("/", (req, res) => {
  res.json({ status: 200, message: "Hello Dinesh" });
});


app.listen(8080, () => {
  console.log("Server is running on port 8080");
});