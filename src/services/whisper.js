/* eslint-disable prettier/prettier */
const OpenAI = require('openai');
const fs = require('fs').promises;
const Config = require("../utils/config");
const logger = require("../utils/logger");

const openai = new OpenAI({
    apiKey: Config.OPENAI_API_KEY
});

const MODEL = 'whisper-1';

// File should be a video or audio file
// Returns text transcription of the file
// May take a few minutes to complete
const transcribeFileHelper = async (FILE) => {
    const transcription = await openai.audio.transcriptions.create({
        // eslint-disable-next-line object-shorthand
        file: FILE,
        model: MODEL,
        language: 'en'
    });
    logger.debug("content : ", transcription.text);
    return transcription.text;
};

const transcribeFile = async (req, res) => {

    try {
        const file_path = req.file.path
        logger.debug(file_path);
        
        if (!file_path) {
            return res
                .status(400)
                .json({ success: false, message: "file required." });
        }

        const data = await fs.readFile(file_path);
        const transcription = await transcribeFileHelper(data);

        return res.status(200).json({
            success: true,
            data: {
                transcription
            }
        });


    } catch (error) {
        logger.error("WhisperService: ", error);
        return res.status(400).json({
            success: false,
            error
        });
    }
};


const whisperService = {
    transcribeFile
};

module.exports = whisperService;
