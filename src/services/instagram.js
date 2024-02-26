require("dotenv").config();
const fetch = require("node-fetch");
const AccountsModel = require("../models/Accounts");
const { ChannelType } = require("../utils/constants");

// Instagram Authentication
exports.authInstagram = (req, res) => {
  // Use facebook login for instagram graph api
  res.redirect(
    `https://www.facebook.com/v19.0/dialog/oauth?client_id=${process.env.FACEBOOK_CLIENT_ID}&redirect_uri=${process.env.FACEBOOK_REDIRECT_URI}&scope=instagram_basic%20instagram_content_publish%20pages_show_list&response_type=code`
  );
};

// Instagram Authentication Callback
exports.authInstagramCallback = async (req, res) => {
  // Authorization Codes are valid for 1 hour and can only be used once.
  try {
    const accessTokenData = await fetch(
      `https://graph.facebook.com/v16.0/oauth/access_token?client_id=${process.env.FACEBOOK_CLIENT_ID}&redirect_uri=${process.env.FACEBOOK_REDIRECT_URI}&client_secret=${process.env.FACEBOOK_CLIENT_SECRET}&code=${req.query.code}`
    )
      .then(response => response.json())
      .then(body => body);

    console.log("accessTokenData!");
    console.log(accessTokenData);

    // Get user page id
    const page_id = await fetch(
      `https://graph.facebook.com/v16.0/me/accounts?access_token=${accessTokenData.access_token}`
    )
      .then(response => response.json())
      .then(data => data);

    console.log("page id!");
    console.log(page_id);

    // Get user account id
    const account_id = await fetch(
      `https://graph.facebook.com/v16.0/${page_id}?fields=instagram_business_account&access_token=${accessTokenData.access_token}`
    )
      .then(response => response.json())
      .then(d => d.instagram_business_account.id);

    console.log("Account id!");
    console.log(account_id);

    // await AccountsModel.findOneAndUpdate({
    //   user: req.user._id,
    //   platform: ChannelType.INSTAGRAM,
    //   token: accessTokenData.access_token,
    //   expire: Date.now + accessTokenData.expires_in
    // });
    return res.status(200).json({
      success: true
    });
  } catch (e) {
    return res.status(200).json({
      success: false,
      e
    });
  }
};

exports.postInstagram = (req, res) => {};
