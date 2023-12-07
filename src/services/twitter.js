const { TwitterApi } = require("twitter-api-v2");
const Config = require("../utils/config");
const logger = require("../utils/logger");

const client = new TwitterApi({
  appKey: Config.TWITTER_API_KEY,
  appSecret: Config.TWITTER_API_SECRET,
  accessToken: Config.TWITTER_ACCESS_TOKEN,
  accessSecret: Config.TWITTER_ACCESS_TOKEN_SECRET
});

const bearer = new TwitterApi(process.env.BEARER_TOKEN);

const twitterClient = client.readWrite;

const twitterBearer = bearer.readOnly;

const tweet = async content => {
  try {
    return await twitterClient.v2.tweet(content);
  } catch (error) {
    logger.error("TwitterService - tweet() : ", error);
    throw error;
  }
};

const TwitterService = { tweet };

module.exports = TwitterService;
