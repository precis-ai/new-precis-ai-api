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
const AnthropicService = require("./anthropic");
const TrainedGPTService = require("./model-fine-tuned");

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

    // ------------------- TWITTER -------------------

    const twitterPrompt = `you are a professional advertisement creator.
    the tweet needs to be less than 250 characters including hashtags and emojis.
    write an advertising tweet for \n
    ${summary}`;

    const openAItwitterPost = await OpenAIService.completeChat(
      `you are a professional advertisement creator.
       the tweet needs to be less than 250 characters including hashtags and emojis.
       write an advertising tweet for \n
       ${summary}`
    );

    logger.debug("openAItwitterPost : ", openAItwitterPost);

    // const twitterAnthropicResponse = await AnthropicService.createMessage(
    //   twitterPrompt
    // );

    // const twitterAnthropicMessages = [];

    // twitterAnthropicResponse.content.forEach(elem => {
    //   if (elem.type === "text") {
    //     twitterAnthropicMessages.push(elem.text);
    //   }
    // });

    // const anthropicTwitterPost = twitterAnthropicMessages.join(" ");

    // logger.debug("anthropicTwitterPost : ", anthropicTwitterPost);

    // const customModelTwitterResponse = await TrainedGPTService.makeTweet(
    //   summary
    // );

    // logger.debug("customModelTwitterResponse : ", customModelTwitterResponse);

    // const customModelTwitterPost = customModelTwitterResponse.map(
    //   elem => elem.message.content
    // );

    const twitter = {
      openai: openAItwitterPost
      // anthropic: anthropicTwitterPost,
      // custom: customModelTwitterPost
    };

    // ------------------- LINKEDIN -------------------

    const linkedInPrompt = `Create a LinkedIn post for the following summary, use relevant hashtags : "${summary}"`;

    const linkedInOpenAiPost = await OpenAIService.completeChat(linkedInPrompt);

    logger.debug("linkedInOpenAiPost : ", linkedInOpenAiPost);

    // const linkedInAnthropicResponse = await AnthropicService.createMessage(
    //   linkedInPrompt
    // );

    // const linkedInAnthropicMessages = [];

    // linkedInAnthropicResponse.content.forEach(elem => {
    //   if (elem.type === "text") {
    //     linkedInAnthropicMessages.push(elem.text);
    //   }
    // });

    // const linkedInAnthropicTwitterPost = linkedInAnthropicMessages.join(" ");

    // logger.debug(
    //   "linkedInAnthropicTwitterPost : ",
    //   linkedInAnthropicTwitterPost
    // );

    // const linkedInCustomModelResponse = await TrainedGPTService.makeTweet(
    //   summary
    // );

    // logger.debug("linkedInCustomModelResponse : ", linkedInCustomModelResponse);

    // const customModelLinkedInPost = linkedInCustomModelResponse.map(
    //   elem => elem.message.content
    // );

    const linkedIn = {
      openai: linkedInOpenAiPost
      // anthropic: linkedInAnthropicTwitterPost,
      // custom: customModelLinkedInPost
    };

    // ------------------- REDDIT -------------------

    const redditPrompt = `Create a Reddit post in the given format. 
    Format: 
      Title: ...
      Post: ...
  for the following summary : "${summary}"`;

    const redditPostOpenAI = await OpenAIService.completeChat(redditPrompt);

    // const redditAnthropicResponse = await AnthropicService.createMessage(
    //   redditPrompt
    // );

    // const redditAnthropicMessages = [];

    // redditAnthropicResponse.content.forEach(elem => {
    //   if (elem.type === "text") {
    //     redditAnthropicMessages.push(elem.text);
    //   }
    // });

    // const redditAnthropicTwitterPost = redditAnthropicMessages.join(" ");

    // logger.debug("redditAnthropicTwitterPost : ", redditAnthropicTwitterPost);

    // const redditCustomModelResponse = await TrainedGPTService.makeTweet(
    //   summary
    // );

    // logger.debug("redditCustomModelResponse : ", redditCustomModelResponse);

    // const customModelRedditPost = redditCustomModelResponse.map(
    //   elem => elem.message.content
    // );

    // logger.debug("customModelRedditPost : ", customModelRedditPost);

    const reddit = {
      openai: redditPostOpenAI
      // anthropic: redditAnthropicTwitterPost,
      // custom: customModelRedditPost
    };

    return response.status(200).json({
      success: true,
      data: {
        twitter,
        linkedIn,
        reddit
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
    console.log(
      "###### mediaIdList[ChannelType.Twitter] : ",
      mediaIdList[ChannelType.Twitter]
    );

    const twitterResponse = await TwitterService.tweet(
      twitterChannel.content,
      user._id,
      mediaIdList[ChannelType.Twitter]
      // ChannelType.Twitter in mediaIdList
      //   ? mediaIdList[ChannelType.Twitter]
      //   : null
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
      // "r/precisaiImageUpload",
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

const sendWithMediaHelper = async (channelsJson, file, user) => {
  const channels = JSON.parse(channelsJson);

  console.log("channels : ", channels);

  console.log("file.path : ", file.path);

  console.log("user : ", user);

  const mediaIdList = await uploadMediaHelper(file.path, channels, user);

  console.log("mediaIdList : ", mediaIdList);

  await sendHelper(channels, user, mediaIdList);

  await WorkspacesModel.findOneAndUpdate(
    { _id: user.workspace._id },
    {
      postSent: true
    }
  );

  fs.unlink(file.path, err => {
    if (err) {
      logger.error(err);
    } else {
      logger.log("File is deleted.");
    }
  });
};

const sendWithMedia = async (request, response) => {
  try {
    await sendWithMediaHelper(
      request.body.channels,
      request.file,
      request.user
    );

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
  sendWithMedia,
  sendWithMediaHelper
};

module.exports = PostsService;
