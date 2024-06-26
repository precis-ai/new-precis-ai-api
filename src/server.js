const express = require("express");
const morgan = require("morgan");
const expressRequestId = require("express-request-id");
const cors = require("cors");

// services
const DatabaseService = require("./services/db");

// controllers
const auth = require("./controllers/v1/auth");
const users = require("./controllers/v1/users");
const marketingStrategy = require("./controllers/v1/marketing-strategy");
const channels = require("./controllers/v1/channels");
const posts = require("./controllers/v1/posts");
const aiTools = require("./controllers/v1/ai-tools");

// utils
const Config = require("./utils/config");
const logger = require("./utils/logger");

const app = express();

app.use((req, res, next) => {
  res.removeHeader("X-Powered-By");
  next();
});

app.use(expressRequestId());

morgan.token("requestId", request => request.id);

app.use(
  morgan(":requestId :method :url :status :response-time ms", {
    stream: {
      write: message => logger.trace(message)
    }
  })
);

const rawBodySaver = (req, res, buf, encoding) => {
  if (buf && buf.length) {
    req.rawBody = buf.toString(encoding || "utf8");
  }
};

app.use(express.json({ verify: rawBodySaver, limit: "50mb" }));
app.use(
  express.urlencoded({ verify: rawBodySaver, extended: true, limit: "50mb" })
);
// app.use(express.raw({ verify: rawBodySaver, type: "*/*", limit: "50mb" }));

const whitelist = [
  // local
  "http://localhost:3000",
  "https://localhost:3000",
  "http://localhost:80",
  "https://localhost:80",
  "http://api.precisai.net",
  "https://api.precisai.net",
  "http://precisai.net",
  "https://precisai.net",
  "http://app.precisai.net",
  "https://app.precisai.net"
];

app.use(
  cors({
    origin: (origin, callback) => {
      // allow requests with no origin
      // (like mobile apps or curl requests)
      if (!origin) return callback(null, true);

      if (whitelist.indexOf(origin) === -1) {
        return callback(
          new Error(
            "The CORS policy for this site does not allow access from the specified Origin."
          ),
          false
        );
      }

      return callback(null, true);
    },
    exposedHeaders: "x-access-token"
  })
);

// ROUTES

app.use("/v1/auth", auth);
app.use("/v1/users", users);
app.use("/v1/marketing-strategy", marketingStrategy);
app.use("/v1/channels", channels);
app.use("/v1/posts", posts);
app.use("/v1/ai-tools", aiTools);

app.get("/v1", (req, res) => {
  res.status(200).json({ success: true, message: "Backend Success!!!" });
});

app.get("/", (req, res) => {
  res.status(200).json({ success: true, message: "Howdy!!!" });
});

app.listen(Config.PORT, () => {
  try {
    logger.info(`App is now running on port ${Config.PORT}!!!`);

    DatabaseService.getInstance(); // init database
  } catch (error) {
    logger.error("Failed to start server -> error : ", error);
  }
});
