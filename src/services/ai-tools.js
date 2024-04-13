const AIToolsModel = require("../models/AITools");
const AIToolsUsageHistoryModel = require("../models/AIToolsUsageHistory");
const WorkspacesModel = require("../models/Workspaces");
const AnthropicService = require("./anthropic");
const { INTERNAL_SERVER_ERROR_MESSAGE } = require("../utils/constants");
const logger = require("../utils/logger");

const list = async (request, response) => {
  try {
    const aiTools = await AIToolsModel.find({});

    return response.status(200).json({
      success: true,
      data: aiTools
    });
  } catch (error) {
    logger.error("AiToolsService - list() -> error : ", error);
    return response
      .status(400)
      .json({ success: false, message: INTERNAL_SERVER_ERROR_MESSAGE });
  }
};

const aiToolDetails = async (request, response) => {
  try {
    const { id: aiToolId } = request.query;

    if (!aiToolId) {
      return response.status(400).json({
        success: false,
        message: "ID is required."
      });
    }

    const aiTool = await AIToolsModel.findById(aiToolId);

    if (!aiTool) {
      return response.status(400).json({
        success: false,
        message: "AI tool does not exists."
      });
    }

    return response.status(200).json({
      success: true,
      data: aiTool
    });
  } catch (error) {
    logger.error("AiToolsService - aiToolDetails() -> error : ", error);
    return response
      .status(400)
      .json({ success: false, message: INTERNAL_SERVER_ERROR_MESSAGE });
  }
};

const listUsageHistory = async (request, response) => {
  try {
    const usageHistory = await AIToolsUsageHistoryModel.find({
      user: request.userId
    })
      .populate("aiTool")
      .sort({ createdAt: -1 });

    return response.status(200).json({
      success: true,
      data: usageHistory
    });
  } catch (error) {
    logger.error("AiToolsService - listUsageHistory() -> error : ", error);
    return response
      .status(400)
      .json({ success: false, message: INTERNAL_SERVER_ERROR_MESSAGE });
  }
};

const getUsageHistoryDetails = async (request, response) => {
  try {
    const { id: historyId } = request.query;

    if (!historyId) {
      return response.status(400).json({
        success: false,
        message: "ID is required."
      });
    }

    const usageHistory = await AIToolsUsageHistoryModel.findById(
      historyId
    ).populate("aiTool");

    return response.status(200).json({
      success: true,
      data: usageHistory
    });
  } catch (error) {
    logger.error(
      "AiToolsService - getUsageHistoryDetails() -> error : ",
      error
    );
    return response
      .status(400)
      .json({ success: false, message: INTERNAL_SERVER_ERROR_MESSAGE });
  }
};

const run = async (request, response) => {
  try {
    const { id: aiToolId, content } = request.body;

    if (!aiToolId) {
      return response.status(400).json({
        success: false,
        message: "ID is required."
      });
    }

    if (!content) {
      return response.status(400).json({
        success: false,
        message: "Content is required."
      });
    }

    const aiTool = await AIToolsModel.findById(aiToolId);

    if (!aiTool) {
      return response.status(400).json({
        success: false,
        message: "AI tool does not exists."
      });
    }

    const anthropicResponse = await AnthropicService.createMessage(
      content,
      aiTool.instructions
    );

    const assistantMessages = [];

    anthropicResponse.content.forEach(elem => {
      if (elem.type === "text") {
        assistantMessages.push(elem.text);
      }
    });

    const result = assistantMessages.join("\n");

    await new AIToolsUsageHistoryModel({
      content,
      response: anthropicResponse,
      result,
      user: request.userId,
      aiTool: aiTool._id
    }).save();

    await WorkspacesModel.findOneAndUpdate(
      { _id: request.user.workspace._id },
      {
        aiToolUsed: true
      }
    );

    return response.status(200).json({
      success: true,
      data: result
    });
  } catch (error) {
    logger.error("AiToolsService - run() -> error : ", error);
    return response
      .status(400)
      .json({ success: false, message: INTERNAL_SERVER_ERROR_MESSAGE });
  }
};

const AiToolsService = {
  list,
  aiToolDetails,
  listUsageHistory,
  getUsageHistoryDetails,
  run
};

module.exports = AiToolsService;
