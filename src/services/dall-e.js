/* eslint-disable prettier/prettier */
const OpenAI = require('openai');
const Config = require("../utils/config");

const openai = new OpenAI({
    apiKey: Config.OPENAI_API_KEY
});

const makeImageHelper = async (content) => {
    const image = await openai.images.generate(
        { 
            model: "dall-e-3", 
            prompt: "A safe for work image that would go well with this promotional tweet: "+content 
        });
    return image.data[0].url;
}

// Makes a single relevant image for the post
// Returns a URL to the image
// Requires 'content' to be passed in the query
// Content should be the text of the post
const makeImage = async (req, res) => {
    const {content} = req.query;
  
    if (!content) {
      return res
        .status(400)
        .json({ success: false, message: "Content required." });
    }
  
    try {
        const image = await makeImageHelper(content);
    
        return res.status(200).json({
            success: true,
            data: {
            image
            }
        });

    } catch (e) {
      return res.status(400).json({
        success: false,
        error: e
      });
    }
  };

const DalleService = {
    makeImage
};

module.exports = DalleService;
