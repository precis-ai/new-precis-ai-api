const ChannelsModel = require("../models/Channels");
const { INTERNAL_SERVER_ERROR_MESSAGE } = require("../utils/constants");
const logger = require("../utils/logger");

const list = async (request, response) => {
  try {
    const channels = await ChannelsModel.find({
      user: request.userId,
      deleted: false
    });
    console.log(channels);
    return response.status(200).json({
      success: true,
      data: channels
    });
  } catch (error) {
    logger.error("ChannelsService - list() -> error : ", error);
    return response
      .status(400)
      .json({ success: false, message: INTERNAL_SERVER_ERROR_MESSAGE });
  }
};

const disconnect = async (request, response) => {
  try {
    const { id: channelId } = request.query;

    if (!channelId) {
      return response.status(400).json({
        success: false,
        message: "ID is required."
      });
    }

    const channel = await ChannelsModel.findById(channelId);

    if (!channel) {
      return response.status(400).json({
        success: false,
        message: "Channel not found."
      });
    }

    channel.deleted = true;

    await channel.save();

    return response.status(200).json({
      success: true,
      message: "Channel disconnected successfully."
    });
  } catch (error) {
    logger.error("ChannelsService - disconnect() -> error : ", error);
    return response
      .status(400)
      .json({ success: false, message: INTERNAL_SERVER_ERROR_MESSAGE });
  }
};

const ChannelsService = {
  list,
  disconnect
};

module.exports = ChannelsService;
