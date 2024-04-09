const express = require("express");
// eslint-disable-next-line import/no-extraneous-dependencies
const multer = require("multer");
const PostsService = require("../../services/posts");
const RedditService = require("../../services/reddit");
const LinkedInService = require("../../services/linkedin");
const ScheduleService = require("../../services/schedule");
const AuthenticationMiddleware = require("../../middlewares/Authentication");
const DalleService = require("../../services/dall-e");
const WhisperService = require("../../services/whisper");

const router = express.Router();

router.get(
  "/",
  AuthenticationMiddleware.authenticate.bind(),
  async (request, response) => {
    return await PostsService.list(request, response);
  }
);

router.post(
  "/summarize",
  AuthenticationMiddleware.authenticate.bind(),
  async (request, response) => {
    return await PostsService.summarize(request, response);
  }
);

router.post(
  "/create",
  AuthenticationMiddleware.authenticate.bind(),
  async (request, response) => {
    return await PostsService.create(request, response);
  }
);

router.post(
  "/send",
  AuthenticationMiddleware.authenticate.bind(),
  async (request, response) => {
    return await ScheduleService.schedule(request, response);
    // return await PostsService.send(request, response);
  }
);

router.get(
  "/reddit/post",
  // AuthenticationMiddleware.authenticate.bind(),
  async (request, response) => {
    return await RedditService.post(request, response);
  }
);

router.get(
  "/linkedin/post",
  // AuthenticationMiddleware.authenticate.bind(),
  async (request, response) => {
    return await LinkedInService.postToLinkedIn(request, response);
  }
);

router.post(
  "/schedule",
  AuthenticationMiddleware.authenticate.bind(),
  async (request, response) => {
    return await ScheduleService.schedule(request, response);
  }
);

router.get(
  "/makeImage",
  // AuthenticationMiddleware.authenticate.bind(),
  async (request, response) => {
    return await DalleService.makeImage(request, response);
  }
);

const upload = multer({ dest: "uploads/" });

router.post(
  "/transcribeFile",
  // AuthenticationMiddleware.authenticate.bind(),
  upload.single("file"),
  async (request, response) => {
    return await WhisperService.transcribeFile(request, response);
  }
);

module.exports = router;
