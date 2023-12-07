const mongoose = require("mongoose");
const Config = require("../utils/config");
const logger = require("../utils/logger");

module.exports = class DatabaseService {
  constructor() {
    mongoose.set("strictQuery", true);
    mongoose
      .connect(Config.MONGO_URL)
      .then(() => logger.info("MongoDB Connected!!!"))
      .catch(err => logger.error("MongoDB Connection Failed -> error ", err));
  }

  static getInstance() {
    if (!DatabaseService.instance) {
      DatabaseService.instance = new DatabaseService();
    }

    return DatabaseService.instance;
  }
};
