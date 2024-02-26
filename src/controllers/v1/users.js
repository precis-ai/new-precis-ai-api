const express = require("express");
const UserService = require("../../services/users");
const {
  authInstagram,
  authInstagramCallback,
  authInstagramAccessToken
} = require("../../services/instagram");
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

router.get(
  "/auth/instagram",
  // AuthenticationMiddleware.authenticate.bind(),
  async (request, response) => {
    return await authInstagram(request, response);
  }
);

router.get(
  "/auth/instagram/callback",
  // AuthenticationMiddleware.authenticate.bind(),
  async (request, response) => {
    return await authInstagramCallback(request, response);
  }
);

module.exports = router;
