const express = require("express");
const TwitterService = require("../../services/twitter");
const LinkedInService = require("../../services/linkedin");
const AuthenticationMiddleware = require("../../middlewares/Authentication");

const router = express.Router();

router.get(
  "/twitter/link",
  AuthenticationMiddleware.authenticate.bind(),
  async (request, response) => {
    return await TwitterService.generateAuthLink(request, response);
  }
);

router.post(
  "/twitter/callback",
  AuthenticationMiddleware.authenticate.bind(),
  async (request, response) => {
    return await TwitterService.authCallback(request, response);
  }
);

router.post(
  "/linkedin/callback",
  AuthenticationMiddleware.authenticate.bind(),
  async (request, response) => {
    return await LinkedInService.authCallback(request, response);
  }
);

module.exports = router;
