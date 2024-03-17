const PostsModel = require("../models/Posts");
const TwitterService = require("./twitter");
const {
  INTERNAL_SERVER_ERROR_MESSAGE,
  ChannelType
} = require("../utils/constants");
const logger = require("../utils/logger");
const OpenAIService = require("./openai");
const LinkedInService = require("./linkedin");

const list = async (request, response) => {
  try {
    const posts = await PostsModel.find({
      workspace: request.user.workspace._id
    });

    return response.status(200).json({
      success: true,
      data: posts
    });
  } catch (error) {
    logger.error("PostsService - list() -> error : ", error);
    return response
      .status(400)
      .json({ success: false, message: INTERNAL_SERVER_ERROR_MESSAGE });
  }
};

const summarize = async (request, response) => {
  try {
    const { description } = request.body;

    if (!description) {
      return response
        .status(400)
        .json({ success: false, message: "Description is required." });
    }

    const openAiResponse = await OpenAIService.completeChat(
      `Write a summary for ${description}`
    );

    logger.debug("openAiResponse : ", openAiResponse);

    return response.status(200).json({
      success: true,
      data: openAiResponse
    });
  } catch (error) {
    logger.error("PostsService - create() -> error : ", error);
    return response
      .status(400)
      .json({ success: false, message: INTERNAL_SERVER_ERROR_MESSAGE });
  }
};

const create = async (request, response) => {
  try {
    const { summary } = request.body;

    if (!summary) {
      return response
        .status(400)
        .json({ success: false, message: "Summary is required." });
    }

    const twitterPost = await OpenAIService.completeChat(
      `you are a professional advertisement creator.
      the tweet needs to be less than 250 characters including hashtags and emojis.
      write an advertising tweet for \n
       ${summary}`
    );

    logger.debug("twitterPost : ", twitterPost);

    const linkedInPost = await OpenAIService.completeChat(
      `Create a LinkedIn post for the following summary, use relevant hashtags : "${summary}"`
    );

    logger.debug("linkedInPost : ", linkedInPost);

    return response.status(200).json({
      success: true,
      data: {
        twitterPost,
        linkedInPost
      }
    });
  } catch (error) {
    logger.error("PostsService - create() -> error : ", error);
    return response
      .status(400)
      .json({ success: false, message: INTERNAL_SERVER_ERROR_MESSAGE });
  }
};

const send = async (request, response) => {
  try {
    const { channels } = request.body;

    if (!channels.length) {
      return response
        .status(400)
        .json({ success: false, message: "Channels are required." });
    }

    const twitterChannel = channels.find(
      elem => elem.platform === ChannelType.Twitter
    );

    const linkedInChannel = channels.find(
      elem => elem.platform === ChannelType.LinkedIn
    );

    if (twitterChannel) {
      const twitterResponse = await TwitterService.tweet(
        twitterChannel.content,
        request.userId
      );

      logger.debug("twitterResponse : ", twitterResponse);

      await new PostsModel({
        content: twitterChannel.content,
        channel: ChannelType.Twitter,
        metadata: {
          id: twitterResponse.data.id
        },
        user: request.user._id,
        workspace: request.user.workspace._id
      }).save();
    }

    if (linkedInChannel) {
      const linkedInResponse = await LinkedInService.postToLinkedIn(
        linkedInChannel.content,
        linkedInChannel.id
      );

      logger.debug("linkedInResponse : ", linkedInResponse);

      if (linkedInResponse.success) {
        await new PostsModel({
          content: linkedInChannel.content,
          channel: ChannelType.LinkedIn,
          metadata: {
            id: linkedInResponse.postId
          },
          user: request.user._id,
          workspace: request.user.workspace._id
        }).save();
      }
    }

    return response.status(200).json({
      success: true,
      message: "Post sent successfully!"
    });
  } catch (error) {
    logger.error("PostsService - send() -> error : ", error);
    return response
      .status(400)
      .json({ success: false, message: INTERNAL_SERVER_ERROR_MESSAGE });
  }
};

const PostsService = {
  list,
  summarize,
  create,
  send
};

module.exports = PostsService;
