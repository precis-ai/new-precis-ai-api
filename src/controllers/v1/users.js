const express = require("express");
const UserService = require("../../services/users");
const AuthenticationMiddleware = require("../../middlewares/Authentication");

const router = express.Router();

router.get(
  "/me",
  AuthenticationMiddleware.authenticate.bind(),
  async (request, response) => {
    return await UserService.me(request, response);
  }
);

router.post("/signin", async (request, response) => {
  return await UserService.signin(request, response);
});

router.post("/signup", async (request, response) => {
  return await UserService.signup(request, response);
});

router.put(
  "/profile",
  AuthenticationMiddleware.authenticate.bind(),
  async (request, response) => {
    return await UserService.updateProfile(request, response);
  }
);

router.put(
  "/workspace",
  AuthenticationMiddleware.authenticate.bind(),
  async (request, response) => {
    return await UserService.updateWorkspace(request, response);
  }
);

module.exports = router;
