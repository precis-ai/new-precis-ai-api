/* eslint-disable prettier/prettier */
const OpenAI = require("openai");
const fs = require("fs");
const Config = require("../utils/config");
const logger = require("../utils/logger");

const openai = new OpenAI({
    apiKey: Config.OPENAI_API_KEY
});

const MODEL = "whisper-1";

// File should be a video or audio file path
// Returns text transcription of the file
// May take a few minutes to complete
const transcribeFileHelper = async FILE => {
    try {
        logger.debug("FILE : ", FILE);
        const transcription = await openai.audio.transcriptions.create({
            file: fs.createReadStream(FILE),
            model: MODEL,
            language: "en"
        });
        logger.debug("success : ", transcription.success);
        // logger.debug("content : ", transcription.text);
        return transcription.text;
    } catch (error) {
        logger.error("WhisperService: ", error);
        throw error;
    };
};

const transcribeFile = async (req, res) => {
    try {
        const file_path = req.file.path;
        logger.debug(file_path);

        if (!file_path) {
            return res
                .status(400)
                .json({ success: false, message: "file required." });
        }

        const transcription = await transcribeFileHelper(file_path);

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
    } finally {
        fs.unlinkSync(req.file.path);
    }
};

const whisperService = {
    transcribeFile
};

module.exports = whisperService;
