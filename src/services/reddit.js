require("dotenv").config();
const fetch = require("node-fetch");
const fs = require("fs/promises");
const FormData = require("form-data");
const { XMLParser } = require("fast-xml-parser");
const path = require("path");
const UsersModel = require("../models/Users");
const ChannelsModel = require("../models/Channels");
const { ChannelType } = require("../utils/constants");
const logger = require("../utils/logger");

const reddit_state = "precis_ai_state";

// Reddit Authentication
exports.auth = (_, res) => {
  res.redirect(
    `https://www.reddit.com/api/v1/authorize?client_id=${process.env.REDDIT_CLIENT_ID}&response_type=code&redirect_uri=${process.env.REDDIT_CALLBACK_URI}&duration=permanent&state=${reddit_state}&scope=identity submit`
  );
};

// Reddit Authentication Callback
exports.authCallback = async (req, res) => {
  const { state, code } = req.query;
  if (state === reddit_state) {
    const base64encodedData = Buffer.from(
      process.env.REDDIT_CLIENT_ID + ":" + process.env.REDDIT_CLIENT_SECRET
    ).toString("base64");

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
            grant_type: "authorization_code",
            code,
            redirect_uri: process.env.REDDIT_CALLBACK_URI
          }).toString()
        }
      ).then(response => response.json());

      console.log("Reddit access token data:");
      console.log(accessTokenData);

      if ("error" in accessTokenData) {
        // eslint-disable-next-line no-throw-literal
        throw {
          error: true,
          message: accessTokenData
        };
      }

      const user = await UsersModel.findOne({
        email: "nicklin1219@gmail.com"
      });

      await ChannelsModel.findOneAndUpdate(
        {
          // user: req.user._id,
          user: user._id,
          platform: ChannelType.Reddit
        },
        {
          token: accessTokenData.access_token,
          refreshToken: accessTokenData.refresh_token,
          expire: new Date(Date.now() + accessTokenData.expires_in * 1000)
        },
        { upsert: true, new: true, setDefaultsOnInsert: true }
      );

      return res.status(400).json({
        success: true
      });
    } catch (e) {
      return res.status(400).json({
        success: false,
        e
      });
    }
  } else {
    return res.status(400).json({
      success: false,
      error: "State not matching"
    });
  }
};

const refreshToken = async userId => {
  const base64encodedData = Buffer.from(
    process.env.REDDIT_CLIENT_ID + ":" + process.env.REDDIT_CLIENT_SECRET
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
          redirect_uri: process.env.REDDIT_CALLBACK_URI
        }).toString()
      }
    ).then(response => response.json());

    console.log("Refresh Token result:");
    console.log(accessTokenData);

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
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    return {
      success: true
    };
  } catch (e) {
    console.log(e);
    // eslint-disable-next-line no-throw-literal
    throw {
      success: false,
      e
    };
  }
};

async function uploadToAWS(uploadURL, fields, buffer, filename) {
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
}

exports.post = async (content, userId, sr, title, filePath) => {
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
      account = await ChannelsModel.findOne({ user: userId });
    } else {
      // eslint-disable-next-line
      throw {
        status: 400,
        error: true,
        message: "Refresh Token failed, please re-authenticate"
      };
    }
  }

  const headers = {
    // "Content-Type": "application/json",
    Authorization: "Bearer " + account.token
  };

  // const u = new URLSearchParams({
  //   sr,
  //   title,
  //   text: content,
  //   kind: "self"
  // }).toString();

  const bodyForm = new FormData();
  bodyForm.append("filepath", filePath);
  bodyForm.append("mimetype", "image/jpeg");

  try {
    const uploadURLResponse = await fetch(
      `https://oauth.reddit.com/api/media/asset.json`,
      {
        method: "POST",
        headers,
        body: bodyForm
      }
    ).then(response => response.json());

    const file = await fs.readFile(filePath);
    const fileName = path.basename(filePath);
    const uploadURL = `https:${uploadURLResponse.args.action}`;
    const { fields } = uploadURLResponse.args;
    const listenWSUrl = uploadURLResponse.asset.websocket_url;

    const imageURL = await uploadToAWS(uploadURL, fields, file, fileName);
    return { imageURL, webSocketURL: listenWSUrl };

    // return await fetch(`https://oauth.reddit.com/api/submit.json?${u}`, {
    //   method: "POST",
    //   headers,
    //   body: {
    //     api_type: "json",
    //     resubmit: "true",
    //     send_replies: "true"
    //   }
    // }).then(response => response.json());
  } catch (error) {
    logger.error("RedditService - uploadMedia() : ", error);
    throw error;
  }
};
