/* eslint-disable prettier/prettier */
const OpenAI = require("openai");
const Config = require("../utils/config");
const logger = require("../utils/logger");

const openai = new OpenAI({
    apiKey: Config.TRAINED_OPENAI_API_KEY
});

const t_model = Config.TRAINED_GPT_MODEL;

const completionHelper = async (text) => {
    return await openai.chat.completions.create({
        messages: [
            {
                role: "system",
                content: "You create social media marketing tweets based off of summaries. Tweets should be no more than 280 characters. Return only the tweet text"
            },
            {
                role: "user",
                content: "You are a professional advertisement creator. Write an advertising tweet for " + text
            }
        ],
        model: t_model,
        temperature: 0.6,
        stop: ["http", ".@", "@", "www"],
        n: 3
    })
};


// Makes 3 tweets using the trained model
const makeTweet = async text => {
    try {
        const completion = await completionHelper(text);
        logger.log(completion.choices);
        return completion.choices;
    } catch (e) {
        logger.error(e);
        return e;
    }
};

const TrainedGPTService = {
    makeTweet
};

module.exports = TrainedGPTService;
