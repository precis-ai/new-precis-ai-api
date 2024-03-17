const express = require("express");
const ChannelsService = require("../../services/channels");
const AuthenticationMiddleware = require("../../middlewares/Authentication");

const router = express.Router();

router.get(
  "/",
  AuthenticationMiddleware.authenticate.bind(),
  async (request, response) => {
    return await ChannelsService.list(request, response);
  }
);

router.delete(
  "/",
  AuthenticationMiddleware.authenticate.bind(),
  async (request, response) => {
    return await ChannelsService.disconnect(request, response);
  }
);

module.exports = router;
