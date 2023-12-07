const log4js = require("log4js");
const Config = require("./config");

const logger = log4js.getLogger();

logger.level = Config.LOG_LEVEL;

module.exports = logger;
