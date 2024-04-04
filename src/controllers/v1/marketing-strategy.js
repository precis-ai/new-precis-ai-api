const express = require("express");
const MarketingStrategyService = require("../../services/marketing-strategy");
const AuthenticationMiddleware = require("../../middlewares/Authentication");

const router = express.Router();

router.get(
  "/",
  AuthenticationMiddleware.authenticate.bind(),
  async (request, response) => {
    return await MarketingStrategyService.list(request, response);
  }
);

router.get(
  "/details",
  AuthenticationMiddleware.authenticate.bind(),
  async (request, response) => {
    return await MarketingStrategyService.details(request, response);
  }
);

router.post(
  "/",
  AuthenticationMiddleware.authenticate.bind(),
  async (request, response) => {
    return await MarketingStrategyService.create(request, response);
  }
);

module.exports = router;
