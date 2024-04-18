const fs = require("fs");
const PostsModel = require("../models/Posts");
const WorkspacesModel = require("../models/Workspaces");
const TwitterService = require("./twitter");
const RedditService = require("./reddit");
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

    const redditPost = await OpenAIService.completeChat(
      `Create a Reddit post in the given format. 
        Format: 
          Title: ...
          Post: ...
      for the following summary : "${summary}"`
    );

    logger.debug("redditPost : ", redditPost);

    return response.status(200).json({
      success: true,
      data: {
        twitterPost,
        linkedInPost,
        redditPost
      }
    });
  } catch (error) {
    logger.error("PostsService - create() -> error : ", error);
    return response
      .status(400)
      .json({ success: false, message: INTERNAL_SERVER_ERROR_MESSAGE });
  }
};

const sendHelper = async (channels, user, mediaIdList = {}) => {
  if (!channels.length) {
    throw new Error("Channels are required.");
  }

  const twitterChannel = channels.find(
    elem => elem.platform === ChannelType.Twitter
  );

  const linkedInChannel = channels.find(
    elem => elem.platform === ChannelType.LinkedIn
  );

  const redditChannel = channels.find(
    elem => elem.platform === ChannelType.Reddit
  );

  if (twitterChannel) {
    const twitterResponse = await TwitterService.tweet(
      twitterChannel.content,
      user._id,
      ChannelType.Twitter in mediaIdList
        ? mediaIdList[ChannelType.Twitter]
        : null
    );

    logger.debug("twitterResponse : ", twitterResponse);

    await new PostsModel({
      content: twitterChannel.content,
      channel: ChannelType.Twitter,
      metadata: {
        id: twitterResponse.data.id
      },
      user: user._id,
      workspace: user.workspace._id
    }).save();
  }

  if (linkedInChannel) {
    let linkedInResponse = null;

    if (ChannelType.LinkedIn in mediaIdList) {
      linkedInResponse = await LinkedInService.postToLinkedInImage(
        linkedInChannel.content,
        linkedInChannel.id,
        mediaIdList[ChannelType.LinkedIn]
      );
    } else {
      linkedInResponse = await LinkedInService.postToLinkedIn(
        linkedInChannel.content,
        linkedInChannel.id
      );
    }

    logger.debug("linkedInResponse : ", linkedInResponse);

    if (linkedInResponse.success) {
      await new PostsModel({
        content: linkedInChannel.content,
        channel: ChannelType.LinkedIn,
        metadata: {
          id: linkedInResponse.postId
        },
        user: user._id,
        workspace: user.workspace._id
      }).save();
    }
  }

  if (redditChannel) {
    const redditResponse = await RedditService.post(
      redditChannel.content,
      user._id,
      "r/precisai",
      redditChannel.title,
      ChannelType.Reddit in mediaIdList ? mediaIdList[ChannelType.Reddit] : null
    );

    logger.debug("redditResponse : ", JSON.stringify(redditResponse));

    if (redditResponse.success) {
      await new PostsModel({
        content: redditChannel.content,
        channel: ChannelType.Reddit,
        metadata: {
          id: redditResponse.postId
        },
        user: user._id,
        workspace: user.workspace._id
      }).save();
    }
  }
};

const send = async (request, response) => {
  try {
    const { channels } = request.body;

    await sendHelper(channels, request.user);

    await WorkspacesModel.findOneAndUpdate(
      { _id: request.user.workspace._id },
      {
        postSent: true
      }
    );

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

const uploadMediaHelper = async (filePath, channels, user) => {
  // Handle file upload endpoint
  const mediaIdList = {};

  if (!channels.length) {
    throw new Error("Channels are required.");
  }

  const twitterChannel = channels.find(
    elem => elem.platform === ChannelType.Twitter
  );

  const linkedInChannel = channels.find(
    elem => elem.platform === ChannelType.LinkedIn
  );

  const redditChannel = channels.find(
    elem => elem.platform === ChannelType.Reddit
  );

  if (twitterChannel) {
    const twitterResponse = await TwitterService.uploadMedia(
      filePath,
      user._id
    );
    logger.debug("twitterUploadMediaResponse : ", twitterResponse);
    mediaIdList[ChannelType.Twitter] = twitterResponse;
  }

  if (linkedInChannel) {
    const linkedInResponse = await LinkedInService.uploadMedia(
      filePath,
      user._id
    );
    logger.debug("linkedInUploadMediaResponse : ", linkedInResponse);
    mediaIdList[ChannelType.LinkedIn] = linkedInResponse;
  }

  if (redditChannel) {
    mediaIdList[ChannelType.Reddit] = filePath;
  }
  return mediaIdList;
};

const uploadMedia = async (request, response) => {
  try {
    const channels = JSON.parse(request.body.channels);

    const mediaIdList = await uploadMediaHelper(
      request.file.path,
      channels,
      request.user
    );

    return response.status(200).json({
      success: true,
      mediaIdList,
      message: "Media upload successfully!"
    });
  } catch (error) {
    logger.error("PostsService - uploadMedia() -> error : ", error);
    return response
      .status(400)
      .json({ success: false, message: INTERNAL_SERVER_ERROR_MESSAGE });
  }
};

const sendWithMedia = async (request, response) => {
  try {
    const channels = JSON.parse(request.body.channels);

    const mediaIdList = await uploadMediaHelper(
      request.file.path,
      channels,
      request.user
    );

    await sendHelper(channels, request.user, mediaIdList);

    await WorkspacesModel.findOneAndUpdate(
      { _id: request.user.workspace._id },
      {
        postSent: true
      }
    );

    fs.unlink(request.file.path, err => {
      if (err) {
        logger.error(err);
      } else {
        logger.log("File is deleted.");
      }
    });

    return response.status(200).json({
      success: true,
      message: "Post sent with media successfully!"
    });
  } catch (error) {
    logger.error("PostsService - uploadMedia() -> error : ", error);
    return response
      .status(400)
      .json({ success: false, message: INTERNAL_SERVER_ERROR_MESSAGE });
  }
};

const PostsService = {
  list,
  summarize,
  create,
  send,
  sendHelper,
  uploadMedia,
  sendWithMedia
};

module.exports = PostsService;
