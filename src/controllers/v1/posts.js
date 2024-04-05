const express = require("express");
const multer = require('multer');
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

// const storage = multer.diskStorage({
//   destination: function (req, file, cb) {
//     cb(null, 'uploads/');
//   },
//   filename: function (req, file, cb) {
//     const fileName = `${Date.now()}-${file.originalname}`;
//     cb(null, fileName);
//   }
// });

// const upload = multer({ storage: storage });

const upload = multer({dest: 'uploads/'});

router.post(
  "/uploadMedia",
  AuthenticationMiddleware.authenticate.bind(),
  upload.single('image'),
  async (request, response) => {
    return await PostsService.uploadMedia(request, response);
  }
)

module.exports = router;
