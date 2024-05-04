const express = require("express");
const multer = require("multer");
const path = require("path");
const PostsService = require("../../services/posts");
const RedditService = require("../../services/reddit");
const LinkedInService = require("../../services/linkedin");
const ScheduleService = require("../../services/schedule");
const AuthenticationMiddleware = require("../../middlewares/Authentication");
const DalleService = require("../../services/dall-e");
const WhisperService = require("../../services/whisper");

const router = express.Router();

const storage = multer.diskStorage({
  destination(req, file, cb) {
    cb(null, "uploads/");
  },
  filename(req, file, cb) {
    const fileName = `${Date.now()}-${file.originalname}`;
    cb(null, fileName);
  }
});
const upload = multer({ storage });

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

router.post(
  "/scheduleMediaPost",
  AuthenticationMiddleware.authenticate.bind(),
  upload.single("file"),
  async (request, response) => {
    return await ScheduleService.scheduleMediaPost(request, response);
  }
);

router.post(
  "/image",
  AuthenticationMiddleware.authenticate.bind(),
  async (request, response) => {
    return await DalleService.makeImage(request, response);
  }
);

const storage2 = multer.diskStorage({
  destination(req, file, cb) {
    cb(null, "uploads/");
  },
  filename(req, file, cb) {
    const ext = path.extname(file.originalname);
    cb(null, file.fieldname + "-" + Date.now() + ext);
  }
});

const upload2 = multer({ storage: storage2 });

router.post(
  "/transcribe",
  // AuthenticationMiddleware.authenticate.bind(),
  upload2.single("file"),
  async (request, response) => {
    return await WhisperService.transcribeFile(request, response);
  }
);

router.post(
  "/send/media",
  AuthenticationMiddleware.authenticate.bind(),
  upload.single("file"),
  async (request, response) => {
    return await PostsService.sendWithMedia(request, response);
  }
);

router.post(
  "/uploadMedia",
  AuthenticationMiddleware.authenticate.bind(),
  upload.single("file"),
  async (request, response) => {
    return await PostsService.uploadMedia(request, response);
  }
);

module.exports = router;
