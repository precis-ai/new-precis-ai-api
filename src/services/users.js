const WorkspacesModel = require("../models/Workspaces");
const UsersModel = require("../models/Users");
const {
  INTERNAL_SERVER_ERROR_MESSAGE,
  UserRoles
} = require("../utils/constants");
const JWT = require("../utils/jwt");
const logger = require("../utils/logger");

const me = (request, response) => {
  try {
    return response.status(200).json({
      success: true,
      data: {
        user: request.user
      }
    });
  } catch (error) {
    logger.error("UserService - me() -> error : ", error);
    return response
      .status(400)
      .json({ success: false, message: INTERNAL_SERVER_ERROR_MESSAGE });
  }
};

const signup = async (request, response) => {
  try {
    const {
      firstName,
      lastName,
      email,
      password,
      confirmPassword
    } = request.body;

    if (!firstName) {
      return response
        .status(400)
        .json({ success: false, message: "First name is required." });
    }

    if (!lastName) {
      return response
        .status(400)
        .json({ success: false, message: "Last name is required." });
    }

    if (!email) {
      return response
        .status(400)
        .json({ success: false, message: "Email is required." });
    }

    if (!password) {
      return response
        .status(400)
        .json({ success: false, message: "Password is required." });
    }

    if (!confirmPassword) {
      return response
        .status(400)
        .json({ success: false, message: "Confirm password is required." });
    }

    if (password !== confirmPassword) {
      return response
        .status(400)
        .json({ success: false, message: "Passwords do not match." });
    }

    const userExists = await UsersModel.findOne({ email });

    if (userExists) {
      return response.status(400).json({
        success: false,
        message: "User with email already exists. Sign in instead."
      });
    }

    const workspace = await new WorkspacesModel({
      name: "My Workspace"
    }).save();

    const hashedPassword = JWT.hash(password, JWT.createSalt());

    const user = await new UsersModel({
      firstName,
      lastName,
      email,
      password: hashedPassword,
      role: UserRoles.ADMIN,
      workspace: workspace._id
    }).save();

    return response.status(200).json({
      success: true,
      data: {
        user,
        token: JWT.encode({ userId: user._id })
      }
    });
  } catch (error) {
    logger.error("UserService - signup() -> error : ", error);
    return response
      .status(400)
      .json({ success: false, message: INTERNAL_SERVER_ERROR_MESSAGE });
  }
};

const signin = async (request, response) => {
  try {
    const { email, password } = request.body;

    if (!email) {
      return response
        .status(400)
        .json({ success: false, message: "Email is required." });
    }

    if (!password) {
      return response
        .status(400)
        .json({ success: false, message: "Password is required." });
    }

    const user = await UsersModel.findOne({ email }).populate("workspace");

    if (!user) {
      return response.status(400).json({
        success: false,
        message:
          "User with email does not exist. Please check your credentials and try again."
      });
    }

    const salt = user.password.split("$")[0];

    const hashedPassword = JWT.hash(password, salt);

    if (hashedPassword !== user.password) {
      return response.status(403).json({
        success: false,
        message: "Incorrect password."
      });
    }

    const token = JWT.encode({ userId: user._id });

    return response.status(200).json({ success: true, data: { user, token } });
  } catch (error) {
    logger.error("UserService - signin() -> error : ", error);
    return response
      .status(400)
      .json({ success: false, message: INTERNAL_SERVER_ERROR_MESSAGE });
  }
};

const updateProfile = async (request, response) => {
  try {
    const { firstName, lastName, email } = request.body;

    const keysToUpdate = {};

    if (firstName) {
      keysToUpdate.firstName = firstName;
    }

    if (lastName) {
      keysToUpdate.lastName = lastName;
    }

    if (email) {
      keysToUpdate.email = email;
    }

    const user = await UsersModel.findOneAndUpdate(
      { _id: request.userId },
      keysToUpdate,
      { new: true }
    );

    return response.status(200).json({
      success: true,
      data: { user },
      message: "Profile updated successfully."
    });
  } catch (error) {
    logger.error("UserService - updateProfile() -> error : ", error);
    return response
      .status(400)
      .json({ success: false, message: INTERNAL_SERVER_ERROR_MESSAGE });
  }
};

const updateWorkspace = async (request, response) => {
  try {
    const { name } = request.body;

    if (!name) {
      return response
        .status(400)
        .json({ success: false, message: "Name is required." });
    }

    await WorkspacesModel.findOneAndUpdate(
      { _id: request.user.workspace._id },
      { name }
    );

    const user = await UsersModel.findById(request.user.workspace._id).populate(
      "workspace"
    );

    return response.status(200).json({
      success: true,
      data: { user },
      message: "Workspace name updated successfully."
    });
  } catch (error) {
    logger.error("UserService - updateWorkspace() -> error : ", error);
    return response
      .status(400)
      .json({ success: false, message: INTERNAL_SERVER_ERROR_MESSAGE });
  }
};

const UserService = {
  me,
  signin,
  signup,
  updateProfile,
  updateWorkspace
};

module.exports = UserService;
