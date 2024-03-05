/* eslint-disable import/newline-after-import */
/* eslint-disable node/no-unsupported-features/node-builtins */
/* eslint-disable prettier/prettier */
require("dotenv").config();
const fetch = require("node-fetch");
const AccountsModel = require("../models/Accounts");
const { ChannelType } = require("../utils/constants");

const linkedInState = "precis_ai_state";

// LinkedIn Authentication
exports.linkedinAuth = (_, res) => {
    res.redirect(
        `https://www.linkedin.com/oauth/v2/authorization?response_type=code&client_id=${process.env.LINKEDIN_CLIENT_ID}&redirect_uri=${encodeURIComponent(process.env.LINKEDIN_CALLBACK_URI)}&state=${linkedInState}&scope=r_liteprofile%20w_member_social`
    );
};

// LinkedIn Authentication Callback
exports.linkedinAuthCallback = async (req, res) => {
    const { state, code } = req.query;

    if (state !== linkedInState) {
        return res.status(400).json({
            success: false,
            error: "State not matching"
        });
    }

    const params = new URLSearchParams({
        grant_type: "authorization_code",
        code,
        redirect_uri: process.env.LINKEDIN_CALLBACK_URI,
        client_id: process.env.LINKEDIN_CLIENT_ID,
        client_secret: process.env.LINKEDIN_CLIENT_SECRET,
    });

    try {
        const response = await fetch(`https://www.linkedin.com/oauth/v2/accessToken`, {
            method: "POST",
            headers: { "Content-Type": "application/x-www-form-urlencoded" },
            body: params.toString(),
        });

        const data = await response.json();

        await AccountsModel.findOneAndUpdate(
            {
                user: req.user._id, 
                platform: ChannelType.LINKEDIN
            },
            {
                token: data.access_token,
                refreshToken: "", // LinkedIn does not provide refresh token by default
                expire: new Date(Date.now() + data.expires_in * 1000)
            },
            { upsert: true, new: true, setDefaultsOnInsert: true }
        );

        res.json({ success: true });
    } catch (e) {
        res.status(400).json({ success: false, error: e.toString() });
    }
};

// Posting to LinkedIn
exports.postToLinkedIn = async (req, res) => {
    const { text } = req.query;
    const account = await AccountsModel.findOne({ user: req.user._id, platform: "LINKEDIN" });
  
    if (!account) {
      return res.status(400).json({ success: false, message: "LinkedIn account not found" });
    }
  
    const accessToken = account.token;
  
    const payload = {
      "author": `urn:li:person:${req.user.linkedinId}`, 
      "lifecycleState": "PUBLISHED",
      "specificContent": {
        "com.linkedin.ugc.ShareContent": {
          "shareCommentary": {
            "text": text
          },
          "shareMediaCategory": "NONE"
        }
      },
      "visibility": {
        "com.linkedin.ugc.MemberNetworkVisibility": "PUBLIC"
      }
    };
  
    try {
      const response = await fetch(`https://api.linkedin.com/v2/ugcPosts`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
          "X-Restli-Protocol-Version": "2.0.0"
        },
        body: JSON.stringify(payload),
      });
  
      if (response.ok) {
        const responseData = await response.json();
        const postId = response.headers.get('X-RestLi-Id'); // Capture the ID of the created post
        res.status(200).json({ success: true, data: responseData, postId });
      } else {
        const errorData = await response.json();
        res.status(400).json({ success: false, message: "Failed to post to LinkedIn", error: errorData });
      }
    } catch (e) {
      res.status(400).json({ success: false, error: e.toString() });
    }
  };
  
