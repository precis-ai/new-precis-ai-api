const fetch = require("node-fetch");
const OAuthsModel = require("../models/OAuths");
const ChannelsModel = require("../models/Channels");
const { ChannelType } = require("../utils/constants");
const Config = require("../utils/config");
const logger = require("../utils/logger");

const linkedInState = "precis_ai_state";

const getUserInfo = async token => {
  try {
    const request = await fetch(`https://api.linkedin.com/v2/userinfo`, {
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
    logger.error("LinkedInService: getUserInfo() -> error : ", error);
    throw error;
  }
};

// LinkedIn Authentication Callback
const authCallback = async (request, response) => {
  try {
    const { state, code } = request.body;

    if (state !== linkedInState) {
      return response.status(400).json({
        success: false,
        error: "State not matching"
      });
    }

    const params = new URLSearchParams({
      grant_type: "authorization_code",
      code,
      redirect_uri: Config.LINKEDIN_CALLBACK_URI,
      client_id: Config.LINKEDIN_CLIENT_ID,
      client_secret: Config.LINKEDIN_CLIENT_SECRET
    });

    const oauthRequest = await fetch(
      `https://www.linkedin.com/oauth/v2/accessToken`,
      {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: params.toString()
      }
    );

    const oauthResponse = await oauthRequest.json();

    logger.debug("oauthResponse : ", oauthResponse);

    const oauth = await new OAuthsModel({
      platform: ChannelType.LinkedIn,
      response: oauthResponse,
      user: request.userId
    }).save();

    const userInfoResponse = await getUserInfo(oauthResponse.access_token);

    await ChannelsModel.findOneAndUpdate(
      {
        user: request.userId,
        platform: ChannelType.LinkedIn
      },
      {
        userInfo: {
          id: userInfoResponse.sub,
          name: userInfoResponse.name,
          handle: "",
          picture: userInfoResponse.picture
        },
        token: oauthResponse.access_token,
        expire: new Date(Date.now() + oauthResponse.expires_in * 1000),
        deleted: false,
        oauth: oauth._id
      },
      { upsert: true, new: true }
    );

    response.json({ success: true });
  } catch (error) {
    logger.error("LinkedInService - authCallback() -> error : ", error);
    response.status(400).json({ success: false, error: error.toString() });
  }
};

// Posting to LinkedIn
const postToLinkedIn = async (content, channelId) => {
  try {
    const channel = await ChannelsModel.findById(channelId);

    const { token } = channel;

    const linkedInUserId = channel.userInfo.id;

    const payload = {
      author: `urn:li:person:${linkedInUserId}`,
      lifecycleState: "PUBLISHED",
      specificContent: {
        "com.linkedin.ugc.ShareContent": {
          shareCommentary: {
            text: content
          },
          shareMediaCategory: "NONE"
        }
      },
      visibility: {
        "com.linkedin.ugc.MemberNetworkVisibility": "PUBLIC"
      }
    };

    const response = await fetch(`https://api.linkedin.com/v2/ugcPosts`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
        "X-Restli-Protocol-Version": "2.0.0"
      },
      body: JSON.stringify(payload)
    });

    if (response.ok) {
      const responseData = await response.json();
      console.log("responseData : ", responseData);

      const postId = response.headers.get("X-RestLi-Id"); // Capture the ID of the created post

      console.log("postId : ", postId);

      return {
        success: true,
        postId
      };
    }

    const errorData = await response.json();

    return {
      success: false,
      error: errorData
    };
  } catch (error) {
    logger.error("postToLinkedIn() -> error : ", error);
    throw error;
  }
};

// TODO Redirect to auth again if needed

const LinkedInService = {
  authCallback,
  postToLinkedIn
};

module.exports = LinkedInService;
