require("dotenv").config();
const fetch = require("node-fetch");
const AccountsModel = require("../models/Accounts");
const { ChannelType } = require("../utils/constants");

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
            callback_uri: process.env.REDDIT_CALLBACK_URI
          }).toString()
        }
      )
        .then(response => response.json())
        .then(body => body);

      await AccountsModel.findOneAndUpdate(
        {
          user: req.user._id,
          platform: ChannelType.REDDIT
        },
        {
          token: accessTokenData.access_token,
          refreshToken: accessTokenData.refresh_token,
          expire: new Date(Date.now() + accessTokenData.expires_in)
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

const refreshToken = async user => {
  const base64encodedData = Buffer.from(
    process.env.REDDIT_CLIENT_ID + ":" + process.env.REDDIT_CLIENT_SECRET
  ).toString("base64");

  const account = await AccountsModel.findOne({ user: user._id });

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
    )
      .then(response => response.json())
      .then(body => body);

    await AccountsModel.findOneAndUpdate(
      {
        user: user._id,
        platform: ChannelType.REDDIT
      },
      {
        token: accessTokenData.access_token,
        refreshToken: accessTokenData.refresh_token,
        expire: new Date(Date.now() + accessTokenData.expires_in)
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    return {
      success: true
    };
  } catch (e) {
    return {
      success: false,
      e
    };
  }
};

exports.post = async (req, res) => {
  const { title, content, sr } = req.query;

  if (!content || !title) {
    return res
      .status(400)
      .json({ success: false, message: "Title and Content are required." });
  }

  let account = await AccountsModel.findOne({ user: req.user._id });

  // Access token expired
  if (account.expire > Date.now()) {
    const refreshTokenResult = await refreshToken(req.user);
    if (refreshTokenResult.success) {
      account = await AccountsModel.findOne({ user: req.user._id });
    } else {
      return res.status(400).json({
        success: false,
        error: "Refresh Token failed, please re-authenticate"
      });
    }
  }

  const headers = {
    "Content-Type": "application/json",
    Authorization: "Bearer " + account.token
  };

  const u = new URLSearchParams({
    sr: sr || title,
    title,
    text: content,
    kind: "self"
  }).toString();

  try {
    await fetch(`https://oauth.reddit.com/api/submit.json?${u}`, {
      method: "POST",
      headers,
      body: {
        api_type: "json",
        resubmit: "true",
        send_replies: "true"
      }
    })
      .then(response => response.json())
      .then(body => body);

    return res.status(200).json({
      success: true
    });
  } catch (e) {
    return res.status(400).json({
      success: false,
      e
    });
  }
};
