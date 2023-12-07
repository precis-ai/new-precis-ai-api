const dotenv = require("dotenv");

dotenv.config();

const Config = {
  PORT: process.env.PORT || 7000,
  APP_ENV: process.env.APP_ENV,
  LOG_LEVEL: process.env.LOG_LEVEL,
  JWT_SECRET_KEY: process.env.JWT_SECRET_KEY,
  APP_BASE_HOST: process.env.APP_BASE_HOST,
  APP_BASE_URL: process.env.APP_BASE_URL,
  MONGO_URL: process.env.MONGO_URL,
  AWS_BUCKET_NAME: process.env.AWS_BUCKET_NAME,
  AWS_BUCKET_BASE_URL: process.env.AWS_BUCKET_BASE_URL,
  AWS_BUCKET_REGION: process.env.AWS_BUCKET_REGION,
  AWS_ACCESS_KEY: process.env.AWS_ACCESS_KEY,
  AWS_SECRET_KEY: process.env.AWS_SECRET_KEY,
  OPENAI_API_KEY: process.env.OPENAI_API_KEY,
  TWITTER_API_KEY: process.env.TWITTER_API_KEY,
  TWITTER_API_SECRET: process.env.TWITTER_API_SECRET,
  TWITTER_ACCESS_TOKEN: process.env.TWITTER_ACCESS_TOKEN,
  TWITTER_ACCESS_TOKEN_SECRET: process.env.TWITTER_ACCESS_TOKEN_SECRET
};

module.exports = Config;
