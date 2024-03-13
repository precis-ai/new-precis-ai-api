const PostsModel = require("../models/Posts");
const TwitterService = require("./twitter");
const {
  INTERNAL_SERVER_ERROR_MESSAGE,
  ChannelType
} = require("../utils/constants");
const logger = require("../utils/logger");
const OpenAIService = require("./openai");

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
      `you are a professional summarizer. The summary needs to be less than 280 words. 
      write a summary for 
      ${description}`
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

    const openAiResponse = await OpenAIService.completeChat(
      `you are a professional advertisement creator.
       write an advertising tweet for \n
       ${summary}`
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

const send = async (request, response) => {
  try {
    const { content } = request.body;

    if (!content) {
      return response
        .status(400)
        .json({ success: false, message: "Content is required." });
    }

    const twitterResponse = await TwitterService.tweet(content);

    logger.debug("twitterResponse : ", twitterResponse);

    const post = await new PostsModel({
      content,
      channel: ChannelType.TWITTER,
      metadata: {
        id: twitterResponse.data.id
      },
      user: request.user._id,
      workspace: request.user.workspace._id
    }).save();

    return response.status(200).json({
      success: true,
      data: post,
      message: "Post sent successfully."
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
