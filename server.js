const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const connectDb = require("./config/db");
const routes = require("./routers.routes");

//testing

const envFile = process.env.NODE_ENV === "production" ? ".env.production" : ".env";
dotenv.config({ path: envFile });

console.log(`Environment: ${process.env.NODE_ENV}`);
console.log(`Loaded config from: ${envFile}`);

const app = express();

const allowedOrigins = [
                        "http://localhost:3000",
                        "https://recuip.com",
                        "https://app.recuip.com",
                        "http://ec2-98-89-29-192.compute-1.amazonaws.com:8080",
                      ];

app.use((req, res, next) => {
  console.log(`${req.method} ${req.url}`);
  next();
});
app.get('/health', (req, res) => {
  res.status(200).send('OK');
});
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
const PORT = process.env.PORT || 8000;

connectDb()
  .then(() => {
    app.listen(PORT, () => {
      console.log(
        `Server is running in ${process.env.NODE_ENV} mode on http://localhost:${PORT}`
      );
    });
  })
  .catch((err) => {
    console.error("Failed to connect to the database:", err.message);
    process.exit(1);
  });
