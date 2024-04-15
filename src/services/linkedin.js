const fetch = require("node-fetch");
const fs = require('fs').promises;
const path = require("path");
const OAuthsModel = require("../models/OAuths");
const ChannelsModel = require("../models/Channels");
const WorkspacesModel = require("../models/Workspaces");
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

    try {
      await WorkspacesModel.findOneAndUpdate(
        { _id: request.user.workspace._id },
        {
          socialAccountConnected: true
        }
      );
    } catch (error) {
      logger.debug("error : ", error);
    }

    return response.json({ success: true });
  } catch (error) {
    logger.error("LinkedInService - authCallback() -> error : ", error);
    response.status(400).json({ success: false, error: error.toString() });
  }
};

const postToLinkedInImage = async (content, channelId) => {
  try {
    const channel = await ChannelsModel.findById(channelId);
    const { token } = channel;

    // TODO : If using multer to upload image. Can grab with req.file.path
    // Either pass image path or image buffer
    // Hardcoded image path because I don't know how to fit multer here
    const file_path = path.join(__dirname, "test.jpg");

    const imageData = await fs.readFile(file_path);

    const linkedInUserId = channel.userInfo.id;
    // console.log("linkedInUserId : ", linkedInUserId);

    // Images must be uploaded to LinkedIn before they can be shared
    const initUploadData = {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "X-Restli-Protocol-Version": "2.0.0",
        "LinkedIn-Version": "202403"
      },
      body: JSON.stringify({
        initializeUploadRequest: {
          owner: `urn:li:person:${linkedInUserId}`
        }
      })
    };

    const getImageUploadUrl = await fetch(
      "https://api.linkedin.com/rest/images?action=initializeUpload",
      initUploadData
    );
    const uploadUrlData = await getImageUploadUrl.json();
    // console.log("uploadUrlData : ", uploadUrlData);
    const { uploadUrl, image } = uploadUrlData.value;
    // console.log("uploadUrl : ", uploadUrl);

    const uploadImage = await fetch(uploadUrl, {
      method: "PUT",
      headers: {
        Authorization: `Bearer ${token}`
      },
      body: imageData
    });
    logger.debug("uploadImage : ", uploadImage);

    const data = {
      author: `urn:li:person:${linkedInUserId}`,
      commentary: content,
      visibility: "PUBLIC",
      distribution: {
        feedDistribution: "MAIN_FEED",
        targetEntities: [],
        thirdPartyDistributionChannels: []
      },
      content: {
        media: {
          title: "Image",
          id: image
        }
      },
      lifecycleState: "PUBLISHED",
      isReshareDisabledByAuthor: false
    };

    const options = {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "X-Restli-Protocol-Version": "2.0.0",
        "LinkedIn-Version": "202403",
        "Content-Type": "application/json"
      },
      body: JSON.stringify(data)
    };

    const response = await fetch(
      `https://api.linkedin.com/rest/posts`,
      options
    );
    logger.debug("response : ", response);

    // Todo : you can remove this if you want
    return response;
    // TODO : you can bring this back also
    /*
    if (response.ok) {
      // const responseData = await response.json();
      // console.log("responseData : ", responseData);

      // Id of the post:  x-restli-id
      const postId = response.headers.get("X-RestLi-Id"); // Capture the ID of the created post

      // console.log("postId : ", postId);

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
    */
  } catch (error) {
    logger.error("postToLinkedIn() -> error : ", error);
    throw error;
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
      // const responseData = await response.json();
      // console.log("responseData : ", responseData);

      const postId = response.headers.get("X-RestLi-Id"); // Capture the ID of the created post

      // console.log("postId : ", postId);

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

const LinkedInService = {
  authCallback,
  postToLinkedIn,
  postToLinkedInImage
};

module.exports = LinkedInService;
