const fetch = require("node-fetch");
const FormData = require("form-data");
const { XMLParser } = require("fast-xml-parser");
const OAuthsModel = require("../models/OAuths");
const ChannelsModel = require("../models/Channels");
const WorkspacesModel = require("../models/Workspaces");
const {
  ChannelType,
  INTERNAL_SERVER_ERROR_MESSAGE
} = require("../utils/constants");
const Config = require("../utils/config");
const logger = require("../utils/logger");

const reddit_state = "precis_ai_state";

const getUserInfo = async token => {
  try {
    const request = await fetch("https://oauth.reddit.com/api/v1/me", {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`
      }
    });

    const response = await request.json();

    logger.debug("user info : ", response);

    return response;
  } catch (error) {
    logger.error("RedditService: getUserInfo() -> error : ", error);
    throw error;
  }
};

const authCallback = async (request, response) => {
  const { state, code } = request.body;

  if (state !== reddit_state) {
    return response.status(400).json({
      success: false,
      error: "State does not match."
    });
  }

  const base64encodedData = Buffer.from(
    Config.REDDIT_CLIENT_ID + ":" + Config.REDDIT_CLIENT_SECRET
  ).toString("base64");

  const headers = {
    "Content-Type": "application/x-www-form-urlencoded",
    Authorization: "Basic " + base64encodedData
  };

  try {
    const oauthRequest = await fetch(
      `https://www.reddit.com/api/v1/access_token`,
      {
        method: "POST",
        headers,
        body: new URLSearchParams({
          grant_type: "authorization_code",
          code,
          redirect_uri: Config.REDDIT_CALLBACK_URI
        }).toString()
      }
    );

    const oauthResponse = await oauthRequest.json();

    logger.debug("oauthResponse : ", oauthResponse);

    const oauth = await new OAuthsModel({
      platform: ChannelType.Reddit,
      response: oauthResponse,
      user: request.userId
    }).save();

    if ("error" in oauthResponse) {
      // eslint-disable-next-line no-throw-literal
      throw {
        error: true,
        message: oauthResponse
      };
    }

    const userInfoResponse = await getUserInfo(oauthResponse.access_token);

    await ChannelsModel.findOneAndUpdate(
      {
        user: request.userId,
        platform: ChannelType.Reddit
      },
      {
        userInfo: {
          id: userInfoResponse.id,
          name: userInfoResponse.subreddit.display_name_prefixed,
          handle: userInfoResponse.name,
          picture: userInfoResponse.icon_img
        },
        token: oauthResponse.access_token,
        refreshToken: oauthResponse.refresh_token,
        expire: new Date(Date.now() + oauthResponse.expires_in * 1000),
        deleted: false,
        oauth: oauth._id
      },
      { upsert: true, new: true }
    );

    await WorkspacesModel.findOneAndUpdate(
      { _id: request.user.workspace._id },
      {
        socialAccountConnected: true
      }
    );

    return response.status(200).json({
      success: true
    });
  } catch (error) {
    logger.error("RedditService - authCallback() -> error : ", error);
    return response
      .status(400)
      .json({ success: false, message: INTERNAL_SERVER_ERROR_MESSAGE });
  }
};

const refreshToken = async userId => {
  const base64encodedData = Buffer.from(
    Config.REDDIT_CLIENT_ID + ":" + Config.REDDIT_CLIENT_SECRET
  ).toString("base64");

  const account = await ChannelsModel.findOne({
    user: userId,
    platform: ChannelType.Reddit
  });

  const headers = {
    "Content-Type": "application/x-www-form-urlencoded",
    Authorization: "Basic " + base64encodedData
  };

  try {
    const accessTokenData = await fetch(
      `https://www.reddit.com/api/v1/access_token`,
      {
        method: "POST",
        headers,
        body: new URLSearchParams({
          grant_type: "refresh_token",
          refresh_token: account.refreshToken,
          redirect_uri: Config.REDDIT_CALLBACK_URI
        }).toString()
      }
    ).then(response => response.json());

    logger.debug("Refresh Token result : ", accessTokenData);

    if ("error" in accessTokenData) {
      // eslint-disable-next-line no-throw-literal
      throw {
        error: true,
        message: accessTokenData
      };
    }

    await ChannelsModel.findOneAndUpdate(
      {
        user: userId,
        platform: ChannelType.Reddit
      },
      {
        token: accessTokenData.access_token,
        refreshToken: accessTokenData.refresh_token,
        expire: new Date(Date.now() + accessTokenData.expires_in * 1000)
      }
    );

    return {
      success: true
    };
  } catch (error) {
    logger.error(error);
    // eslint-disable-next-line no-throw-literal
    throw {
      success: false,
      error
    };
  }
};

const uploadToAWS = async (uploadURL, fields, buffer, filename) => {
  const bodyForm = new FormData();
  fields.forEach(field => bodyForm.append(...Object.values(field)));
  bodyForm.append("file", buffer, filename);

  const responseRaw = await fetch(uploadURL, {
    method: "POST",
    body: bodyForm
  });
  const response = await responseRaw.text();

  try {
    const parser = new XMLParser();
    const xml = parser.parse(response);
    const encodedURL = xml.PostResponse.Location;
    if (!encodedURL)
      // eslint-disable-next-line no-throw-literal
      throw {
        error: true,
        message: "No URL returned"
      };
    const imageURL = decodeURIComponent(encodedURL);
    return imageURL;
  } catch (e) {
    console.error("CDN Response:", response);
    throw e;
  }
};

const post = async (content, userId, sr, title, filePath) => {
  if (!content || !sr || !title) {
    // eslint-disable-next-line
    throw {
      error: true,
      message: "No content or sr or title provided"
    };
  }

  let account = await ChannelsModel.findOne({
    user: userId,
    platform: ChannelType.Reddit
  });

  // Access token expired
  if (new Date(account.expire).getTime() < Date.now()) {
    const refreshTokenResult = await refreshToken(userId);
    console.log("Refresh access token");
    if (refreshTokenResult.success) {
      account = await ChannelsModel.findOne({
        user: userId,
        platform: ChannelType.Reddit
      });
    } else {
      // eslint-disable-next-line
      throw {
        status: 400,
        error: true,
        message: "Refresh Token failed, please re-authenticate"
      };
    }
  }

  // const headers = {
  //   // "Content-Type": "application/json",
  //   Authorization: "Bearer " + account.token
  // };

  // // const u = new URLSearchParams({
  // //   sr,
  // //   title,
  // //   text: content,
  // //   kind: "self"
  // // }).toString();

  // const bodyForm = new FormData();
  // bodyForm.append("filepath", filePath);
  // bodyForm.append("mimetype", "image/jpeg");

  try {
    // const uploadURLResponse = await fetch(
    //   `https://oauth.reddit.com/api/media/asset.json`,
    //   {
    //     method: "POST",
    //     headers,
    //     body: bodyForm
    //   }
    // ).then(response => response.json());

    // console.log(uploadURLResponse);

    // const file = await fs.readFile(filePath);
    // const fileName = path.basename(filePath);
    // const uploadURL = `https:${uploadURLResponse.args.action}`;
    // const { fields } = uploadURLResponse.args;
    // // const listenWSUrl = uploadURLResponse.asset.websocket_url;

    // const imageURL = await uploadToAWS(uploadURL, fields, file, fileName);

    logger.debug("token : ", account.token);

    const postHeaders = {
      "Content-Type": "application/json",
      Authorization: "Bearer " + account.token
    };

    // const u = new URLSearchParams({
    //   sr: "u_TeacherDismal6302",
    //   title,
    //   text: content,
    //   kind: "self"
    //   // url: "https://i.ibb.co/cNfXLhv/golden-state-warriors-logo.jpg"
    // }).toString();

    logger.debug("sr : ", sr);
    logger.debug("title : ", title.trim());
    logger.debug("content : ", content.trim());

    const u = new URLSearchParams({
      sr,
      title: String(title).trim(),
      text: String(content).trim(),
      kind: "self"
    }).toString();

    logger.debug("u : ", u);

    const redditRequest = await fetch(
      `https://oauth.reddit.com/api/submit.json?${u}`,
      {
        method: "POST",
        postHeaders,
        body: JSON.stringify({
          api_type: "json",
          resubmit: "true",
          send_replies: "true"
        })
      }
    );

    const redditResponse = await redditRequest.json();

    console.log(redditResponse);
    return redditResponse;
  } catch (error) {
    logger.error("RedditService - uploadMedia() : ", error);
    throw error;
  }
};

const RedditService = {
  authCallback,
  refreshToken,
  post
};

module.exports = RedditService;
