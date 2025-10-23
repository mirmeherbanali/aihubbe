const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const connectDb = require("./config/db");
const routes= require("./routers.routes")
dotenv.config();

const app = express();
const allowedOrigins = ["http://localhost:3000"];

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error("Not allowed by CORS"));
      }
    },
    credentials: true,
  })
);

app.use(express.json());

app.use(routes);


const PORT = process.env.PORT || 4000;

connectDb().then(() => {
  app.listen(PORT, () => {
    console.log(
      `Server is running in ${process.env.NODE_ENV} mode on http://localhost:${PORT}`
    );
  });
});
