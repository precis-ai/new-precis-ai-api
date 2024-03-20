const Agenda = require("agenda");
const PostsService = require("./posts");
const { INTERNAL_SERVER_ERROR_MESSAGE } = require("../utils/constants");
const logger = require("../utils/logger");

const agenda = new Agenda({ db: { address: process.env.MONGO_URL } });

agenda.define("send post", { priority: "high", concurrency: 10 }, async job => {
  const { channels, user } = job.attrs.data;
  PostsService.sendHelper(channels, user);
});

exports.schedule = async (request, response) => {
  const { channels, timestamp } = request.body;

  const time = Math.max(Math.round((timestamp - Date.now()) / 1000), 0);

  await agenda.start();
  try {
    agenda.schedule("in " + time + " seconds", "send post", {
      channels,
      user: request.user
    });
    return response.status(200).json({
      success: true,
      message: "Post scheduled"
    });
  } catch (error) {
    logger.error("PostsService - send() -> error : ", error);
    return response
      .status(400)
      .json({ success: false, message: INTERNAL_SERVER_ERROR_MESSAGE });
  }
};
