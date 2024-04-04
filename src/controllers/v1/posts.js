const express = require("express");
const PostsService = require("../../services/posts");
const RedditService = require("../../services/reddit");
const LinkedInService = require("../../services/linkedin");
const ScheduleService = require("../../services/schedule");
const AuthenticationMiddleware = require("../../middlewares/Authentication");

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
  "/",
  AuthenticationMiddleware.authenticate.bind(),
  async (request, response) => {
    return await PostsService.create(request, response);
  }
);

router.post(
  "/send",
  AuthenticationMiddleware.authenticate.bind(),
  async (request, response) => {
    return await PostsService.send(request, response);
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

module.exports = router;
