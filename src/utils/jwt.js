const crypto = require("crypto");
const jwt = require("jsonwebtoken");
const Config = require("./config");

const encode = (payload, options = {}) => {
  if (Object.keys(options).length) {
    return jwt.sign(payload, Config.JWT_SECRET_KEY, options);
  }

  return jwt.sign(payload, Config.JWT_SECRET_KEY);
};

const decode = token => jwt.verify(token, Config.JWT_SECRET_KEY);

const createSalt = () => crypto.randomBytes(128).toString("hex");

const hash = (input, salt) => {
  const hashed = crypto.pbkdf2Sync(input, salt, 10000, 512, "sha512");
  return [salt, hashed.toString("hex")].join("$");
};

// abc123 - salt -> salt$4218hfs -> abc123

// split -> ["salt", "4218hfs"]

const JWT = {
  encode,
  decode,
  hash,
  createSalt
};

module.exports = JWT;
