const Anthropic = require("@anthropic-ai/sdk");
const Config = require("../utils/config");
const logger = require("../utils/logger");

const anthropic = new Anthropic({
  apiKey: Config.ANTHROPIC_API_KEY
});

const createMessage = async (content, instructions = null) => {
  try {
    const payload = {
      max_tokens: 1024,
      messages: [{ role: "user", content }],
      model: "claude-3-haiku-20240307"
    };

    if (instructions) {
      payload.system = instructions;
    }

    const message = await anthropic.messages.create(payload);

    logger.debug(message);

    return message;
  } catch (error) {
    logger.error("AnthropicService - createMessage() -> error : ", error);
  }
};

const AnthropicService = {
  createMessage
};

module.exports = AnthropicService;
