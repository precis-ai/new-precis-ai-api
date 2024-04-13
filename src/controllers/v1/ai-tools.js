const express = require("express");
const AiToolsService = require("../../services/ai-tools");
const AuthenticationMiddleware = require("../../middlewares/Authentication");

const router = express.Router();

router.get(
  "/",
  AuthenticationMiddleware.authenticate.bind(),
  async (request, response) => {
    return await AiToolsService.list(request, response);
  }
);

router.get(
  "/details",
  AuthenticationMiddleware.authenticate.bind(),
  async (request, response) => {
    return await AiToolsService.aiToolDetails(request, response);
  }
);

router.get(
  "/usage-history",
  AuthenticationMiddleware.authenticate.bind(),
  async (request, response) => {
    return await AiToolsService.listUsageHistory(request, response);
  }
);

router.get(
  "/usage-history/details",
  AuthenticationMiddleware.authenticate.bind(),
  async (request, response) => {
    return await AiToolsService.getUsageHistoryDetails(request, response);
  }
);

router.post(
  "/run",
  AuthenticationMiddleware.authenticate.bind(),
  async (request, response) => {
    return await AiToolsService.run(request, response);
  }
);

module.exports = router;
