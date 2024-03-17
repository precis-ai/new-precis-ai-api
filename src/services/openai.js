const OpenAI = require("openai");
const Config = require("../utils/config");
const logger = require("../utils/logger");

const openai = new OpenAI({
  apiKey: Config.OPENAI_API_KEY
});

const completeChat = async content => {
  try {
    logger.debug("content : ", content);

    const response = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      // max_tokens: 280,
      messages: [{ role: "user", content }]
    });

    logger.debug("completeChat() - response : ", response);

    return response.choices[0].message.content;
  } catch (error) {
    logger.error("OpenAIService - completeChat() -> error : ", error);
    throw error;
  }
};

const OpenAIService = {
  completeChat
};

module.exports = OpenAIService;
