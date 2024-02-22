require("dotenv").config();
// Instagram Authentication
exports.authInstagram = (req, res) => {
  // Use facebook login for instagram graph api
  res.redirect(
    `https://www.facebook.com/v19.0/dialog/oauth?client_id=${process.env.FACEBOOK_CLIENT_ID}&redirect_uri=${process.env.FACEBOOK_REDIRECT_URI}&scope=instagram_basic&response_type=code`
  );
};

// Twitter Authentication Callback
exports.authInstagramCallback = (req, res) => {
  // Authorization Codes are valid for 1 hour and can only be used once.
  res.redirect(
    `https://graph.facebook.com/v19.0/oauth/access_token?client_id=${process.env.FACEBOOK_CLIENT_ID}&redirect_uri=${process.env.FACEBOOK_REDIRECT_URI}&client_secret=${process.env.FACEBOOK_CLIENT_SECRET}&code=${req.query.code}`
  );
};
exports.authInstagramAccessToken = (req, res) => {
  // Authorization Codes are valid for 1 hour and can only be used once.
  console.log(req.body);
};
