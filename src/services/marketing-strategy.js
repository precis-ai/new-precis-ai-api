const MarketingStrategiesModel = require("../models/MarketingStrategies");
const AnthropicService = require("./anthropic");
const { INTERNAL_SERVER_ERROR_MESSAGE } = require("../utils/constants");
const logger = require("../utils/logger");

const list = async (request, response) => {
  try {
    const marketingStrategies = await MarketingStrategiesModel.find({
      workspace: request.user.workspace._id
    }).populate("user");

    return response.status(200).json({
      success: true,
      data: marketingStrategies
    });
  } catch (error) {
    logger.error("MarketingStrategyService - list() -> error : ", error);
    return response
      .status(400)
      .json({ success: false, message: INTERNAL_SERVER_ERROR_MESSAGE });
  }
};

const details = async (request, response) => {
  try {
    const { id } = request.query;

    if (!id) {
      return response
        .status(400)
        .json({ success: false, message: "ID is required." });
    }

    const marketingStrategy = await MarketingStrategiesModel.findById(id);

    return response.status(200).json({
      success: true,
      data: marketingStrategy
    });
  } catch (error) {
    logger.error("MarketingStrategyService - details() -> error : ", error);
    return response
      .status(400)
      .json({ success: false, message: INTERNAL_SERVER_ERROR_MESSAGE });
  }
};

const create = async (request, response) => {
  try {
    const { name, content } = request.body;

    if (!name) {
      return response
        .status(400)
        .json({ success: false, message: "Name is required." });
    }

    if (!content || !content.length) {
      return response
        .status(400)
        .json({ success: false, message: "Content is required." });
    }

    const { name: businessName } = request.user.workspace;

    const wrappedContent = `For a company named "${businessName}", write a marketing campaign strategy with content ideas and schedule on how often to post so that the company can generate brand awareness, here's what the marketing campaign should focus on: 
    "${businessName} helps ${content[0]} in ${content[1]} to ${content[2]} by ${content[3]}. With this campaign, we wish to ${content[4]}."
    Give a marketing campaign written in English with a conversational tone.
    `;

    const anthropicResponse = await AnthropicService.createMessage(
      wrappedContent
    );

    const marketingStrategy = await new MarketingStrategiesModel({
      name,
      content,
      strategy: anthropicResponse.content,
      user: request.userId,
      workspace: request.user.workspace._id
    }).save();

    return response.status(200).json({
      success: true,
      data: marketingStrategy
    });
  } catch (error) {
    logger.error("MarketingStrategyService - create() -> error : ", error);
    return response
      .status(400)
      .json({ success: false, message: INTERNAL_SERVER_ERROR_MESSAGE });
  }
};

const MarketingStrategyService = {
  list,
  details,
  create
};

module.exports = MarketingStrategyService;
