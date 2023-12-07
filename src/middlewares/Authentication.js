const UsersModel = require("../models/Users");
const JWT = require("../utils/jwt");

const authenticate = async (request, response, next) => {
  try {
    const token = request.headers["x-access-token"];

    if (!token) {
      // eslint-disable-next-line
      throw {
        status: 401,
        success: false,
        message: "Invalid Request."
      };
    }

    const decoded = JWT.decode(token);

    if (!decoded || !decoded.userId) {
      // eslint-disable-next-line
      throw {
        status: 401,
        success: false,
        message: "Invalid Token."
      };
    }

    const user = await UsersModel.findById(decoded.userId).populate(
      "workspace"
    );

    if (!user) {
      // eslint-disable-next-line
      throw {
        status: 401,
        error: true,
        message: "Access denied. User does not exist."
      };
    }

    request.user = user;
    request.userId = user._id;

    next();
  } catch (error) {
    return response
      .status(error.status || 400)
      .json({ success: false, message: error.message, error: error.error });
  }
};

const AuthenticationMiddleware = {
  authenticate
};

module.exports = AuthenticationMiddleware;
