const Agenda = require("agenda");
const WorkspacesModel = require("../models/Workspaces");
const PostsService = require("./posts");
const { INTERNAL_SERVER_ERROR_MESSAGE } = require("../utils/constants");
const Config = require("../utils/config");
const logger = require("../utils/logger");

const SEND_POST_EVENT = "send post";
const SEND_MEDIA_POST_EVENT = "send media post";

const agenda = new Agenda({ db: { address: Config.MONGO_URL } });

agenda.define(
  SEND_POST_EVENT,
  { priority: "high", concurrency: 10 },
  async job => {
    try {
      const { channels, user } = job.attrs.data;
      await PostsService.sendHelper(channels, user);
    } catch (error) {
      logger.error("AGENDA ERROR : ", error);
    }
  }
);

agenda.define(
  SEND_MEDIA_POST_EVENT,
  { priority: "high", concurrency: 10 },
  async job => {
    try {
      const { channels, file, user } = job.attrs.data;
      await PostsService.sendWithMediaHelper(channels, file, user);
    } catch (error) {
      logger.error("AGENDA ERROR : ", error);
    }
  }
);

const schedule = async (request, response) => {
  try {
    const { channels, timestamp } = request.body;

    await agenda.start();

    const jobDate = new Date(timestamp);

    agenda.schedule(jobDate, SEND_POST_EVENT, {
      channels,
      user: request.user
    });

    await WorkspacesModel.findOneAndUpdate(
      { _id: request.user.workspace._id },
      {
        postScheduled: true
      }
    );

    return response.status(200).json({
      success: true,
      message: "Post scheduled"
    });
  } catch (error) {
    logger.error("ScheduleService - schedule() -> error : ", error);
    return response
      .status(400)
      .json({ success: false, message: INTERNAL_SERVER_ERROR_MESSAGE });
  }
};

const scheduleMediaPost = async (request, response) => {
  try {
    const { channels, timestamp } = request.body;

    await agenda.start();

    const jobDate = new Date(timestamp);

    agenda.schedule(jobDate, SEND_MEDIA_POST_EVENT, {
      channels,
      file: request.file,
      user: request.user
    });

    await WorkspacesModel.findOneAndUpdate(
      { _id: request.user.workspace._id },
      {
        postScheduled: true
      }
    );

    return response.status(200).json({
      success: true,
      message: "Post scheduled"
    });
  } catch (error) {
    logger.error("ScheduleService - schedule() -> error : ", error);
    return response
      .status(400)
      .json({ success: false, message: INTERNAL_SERVER_ERROR_MESSAGE });
  }
};

const ScheduleService = {
  schedule,
  scheduleMediaPost
};

module.exports = ScheduleService;
