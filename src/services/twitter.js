const { TwitterApi } = require("twitter-api-v2");
const OAuthsModel = require("../models/OAuths");
const ChannelsModel = require("../models/Channels");
const {
  INTERNAL_SERVER_ERROR_MESSAGE,
  ChannelType
} = require("../utils/constants");
const Config = require("../utils/config");
const logger = require("../utils/logger");

const getClient = async userId => {
  try {
    const twitterChannel = await ChannelsModel.findOne({
      platform: ChannelType.Twitter,
      user: userId
    });

    if (!twitterChannel) {
      // eslint-disable-next-line
      throw {
        status: 400,
        error: true,
        message: "Twitter channel not found."
      };
    }

    const client = new TwitterApi({
      appKey: Config.TWITTER_API_KEY,
      appSecret: Config.TWITTER_API_SECRET,
      accessToken: twitterChannel.token,
      accessSecret: twitterChannel.secret
    });

    const twitterClient = client.readWrite;

    return { twitterClient };
  } catch (error) {
    logger.error("TwitterService - getClient() : ", error);
    throw error;
  }
};

const CALLBACK_URL = "http://localhost:3000/auth/twitter/callback";

const generateAuthLink = async (request, response) => {
  try {
    const client = new TwitterApi({
      appKey: Config.TWITTER_API_KEY,
      appSecret: Config.TWITTER_API_SECRET
    });

    const authLink = await client.generateAuthLink(CALLBACK_URL, {
      linkMode: "authorize"
    });

    logger.debug("authLink : ", authLink);

    await new OAuthsModel({
      platform: ChannelType.Twitter,
      twitterAuthLinkResponse: authLink,
      user: request.userId
    }).save();

    return response.status(200).json({
      success: true,
      data: {
        url: authLink.url
      }
    });
  } catch (error) {
    logger.error("TwitterService - generateAuthLink() : ", error);
    return response
      .status(400)
      .json({ success: false, message: INTERNAL_SERVER_ERROR_MESSAGE });
  }
};

const authCallback = async (request, response) => {
  try {
    const { oauthToken, oauthVerifier } = request.body;

    if (!oauthToken || !oauthVerifier) {
      return response.status(400).json({
        success: false,
        message: "Invalid params."
      });
    }

    const oauth = await OAuthsModel.findOne({
      platform: ChannelType.Twitter,
      "twitterAuthLinkResponse.oauth_token": oauthToken,
      user: request.userId
    });

    if (
      !oauth ||
      !oauth.twitterAuthLinkResponse ||
      !oauth.twitterAuthLinkResponse.oauth_token_secret
    ) {
      return response.status(400).json({
        success: false,
        message: "You denied the app or your session expired."
      });
    }

    const newClient = new TwitterApi({
      appKey: Config.TWITTER_API_KEY,
      appSecret: Config.TWITTER_API_SECRET,
      accessToken: oauthToken,
      accessSecret: oauth.twitterAuthLinkResponse.oauth_token_secret
    });

    const newClientLogin = await newClient.login(oauthVerifier);

    logger.debug("newClientLogin : ", newClientLogin);

    oauth.response = {
      accessToken: newClientLogin.accessToken,
      accessSecret: newClientLogin.accessSecret,
      userId: newClientLogin.userId,
      screenName: newClientLogin.screenName
    };
    await oauth.save();

    const userInfo = await newClientLogin.client.currentUser();

    logger.debug("userInfo : ", userInfo);

    await ChannelsModel.findOneAndUpdate(
      {
        user: request.userId,
        platform: ChannelType.Twitter
      },
      {
        userInfo: {
          id: userInfo.id_str,
          name: userInfo.name,
          handle: userInfo.screen_name,
          picture: userInfo.profile_image_url_https
        },
        token: newClientLogin.accessToken,
        secret: newClientLogin.accessSecret,
        deleted: false,
        oauth: oauth._id
      },
      { upsert: true, new: true }
    );

    return response.status(200).json({
      success: true
    });
  } catch (error) {
    logger.error("TwitterService - authCallback() : ", error);
    return response
      .status(400)
      .json({ success: false, message: INTERNAL_SERVER_ERROR_MESSAGE });
  }
};

const tweet = async (content, userId, mediaId) => {
  try {
    const { twitterClient } = await getClient(userId);

    if (mediaId) {
      return await twitterClient.v2.tweet({
        text: content,
        media: { media_ids: [mediaId] }
      });
    }

    return await twitterClient.v2.tweet(content);
  } catch (error) {
    logger.error("TwitterService - tweet() : ", error);
    throw error;
  }
};

const uploadMedia = async (filePath, userId) => {
  try {
    if (!filePath) {
      logger.error("TwitterService - uploadMedia() : No file provided");
      // eslint-disable-next-line
      throw {
        status: 400,
        error: true,
        message: "No file provided"
      };
    }

    const { twitterClient } = await getClient(userId);
    const mediaResult = await twitterClient.v1.uploadMedia(filePath);
    return mediaResult;
  } catch (error) {
    logger.error("TwitterService - uploadMedia() : ", error);
    throw error;
  }
};

const TwitterService = { generateAuthLink, authCallback, tweet, uploadMedia };

module.exports = TwitterService;
