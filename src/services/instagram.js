// Instagram Authentication
exports.authInstagram = (req, res) => {
  const client_id = 3758231197791500;
  // const secret = "d238fc77546a1b091fc0c3b83dbe6b8d";
  const redirect_url = "http://localhost:7000/v1/users/auth/instagram/callback";

  res.redirect(
    `https://www.facebook.com/v19.0/dialog/oauth?client_id=${client_id}&redirect_uri=${redirect_url}&scope=instagram_basic&response_type=code`
  );
};

// Twitter Authentication Callback
exports.authInstagramCallback = (req, res) => {
  // Authorization Codes are valid for 1 hour and can only be used once.
  console.log(req.query.code);
  const client_id = 3758231197791500;
  const secret = "d238fc77546a1b091fc0c3b83dbe6b8d";
  const redirect_url = "http://localhost:7000/v1/users/auth/instagram/callback";
  res.redirect(
    `https://graph.facebook.com/v19.0/oauth/access_token?client_id=${client_id}&redirect_uri=${redirect_url}&client_secret=${secret}&code=${req.query.code}`
  );
};
exports.authInstagramAccessToken = (req, res) => {
  // Authorization Codes are valid for 1 hour and can only be used once.
  console.log(req.body);
};
