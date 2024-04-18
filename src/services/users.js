const WorkspacesModel = require("../models/Workspaces");
const UsersModel = require("../models/Users");
const MarketingStrategiesModel = require("../models/MarketingStrategies");
const {
  INTERNAL_SERVER_ERROR_MESSAGE,
  UserRoles,
  UserStatus
} = require("../utils/constants");
const JWT = require("../utils/jwt");
const Config = require("../utils/config");
const logger = require("../utils/logger");
const AnthropicService = require("./anthropic");

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
      confirmPassword,
      workspaceId
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

    if (!workspaceId) {
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
        status: UserStatus.ACTIVE,
        workspace: workspace._id
      }).save();

      return response.status(200).json({
        success: true,
        data: {
          user,
          token: JWT.encode({ userId: user._id })
        }
      });
    }

    // member signup

    const workspace = await WorkspacesModel.findById(workspaceId);

    if (!workspace) {
      return response.status(400).json({
        success: false,
        message: "Workspace does not exists."
      });
    }

    const userExists = await UsersModel.findOne({
      email,
      status: UserStatus.INVITED,
      workspace: workspaceId
    });

    if (!userExists) {
      return response.status(400).json({
        success: false,
        message: "Invitation for user does not exists."
      });
    }

    const hashedPassword = JWT.hash(password, JWT.createSalt());

    const user = await UsersModel.findOneAndUpdate(
      {
        _id: userExists._id,
        email,
        workspace: workspace._id
      },
      {
        firstName,
        lastName,
        password: hashedPassword,
        status: UserStatus.ACTIVE
      }
    );

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

const onboard = async (request, response) => {
  try {
    const { name, content } = request.body;

    if (!name) {
      return response
        .status(400)
        .json({ success: false, message: "Name is required." });
    }

    if (!content || !content.length) {
      return response
        .status(400)
        .json({ success: false, message: "Content is required." });
    }

    const workspace = await WorkspacesModel.findById(
      request.user.workspace._id
    );

    if (!workspace) {
      return response
        .status(400)
        .json({ success: false, message: "Workspace does not exists." });
    }

    workspace.name = name;

    workspace.onboardingCompleted = true;

    await workspace.save();

    const wrappedContent = `For a company named "${name}", write a marketing campaign strategy with content ideas and schedule on how often to post so that the company can generate brand awareness, here's what the marketing campaign should focus on: 
    "${name} helps ${content[0]} in ${content[1]} to ${content[2]} by ${content[3]}. With this campaign, we wish to ${content[4]}."
    Give a marketing campaign written in English with a conversational tone.
    `;

    const anthropicResponse = await AnthropicService.createMessage(
      wrappedContent
    );

    await new MarketingStrategiesModel({
      name: `${name}'s Marketing Strategy`,
      content,
      strategy: anthropicResponse.content,
      user: request.userId,
      workspace: workspace._id
    }).save();

    return response.status(200).json({
      success: true
    });
  } catch (error) {
    logger.error("UserService - onboard() -> error : ", error);
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

const listMembers = async (request, response) => {
  try {
    const members = await UsersModel.find({
      workspace: request.user.workspace._id
    });

    return response.status(200).json({
      success: true,
      data: members
    });
  } catch (error) {
    logger.error("UserService - listMembers() -> error : ", error);
    return response
      .status(400)
      .json({ success: false, message: INTERNAL_SERVER_ERROR_MESSAGE });
  }
};

const inviteMember = async (request, response) => {
  try {
    const { email, role } = request.body;

    if (!email) {
      return response
        .status(400)
        .json({ success: false, message: "Email is required." });
    }

    if (!role) {
      return response
        .status(400)
        .json({ success: false, message: "Role is required." });
    }

    const user = await UsersModel.findOne({ email });

    if (user && user.status === UserStatus.ACTIVE) {
      return response
        .status(400)
        .json({ success: false, message: "Member already exists." });
    }

    await UsersModel.findOneAndUpdate(
      { email, workspace: request.user.workspace._id },
      {
        email,
        role,
        status: UserStatus.INVITED,
        workspace: request.user.workspace._id
      },
      {
        upsert: true
      }
    );

    const link = `${Config.APP_BASE_URL}/signup?id=${request.user.workspace._id}&email=${email}`;

    logger.debug("link : ", link);

    await WorkspacesModel.findOneAndUpdate(
      { _id: request.user.workspace._id },
      {
        invitedTeamMembers: true
      }
    );

    return response.status(200).json({
      success: true,
      message: "Member invited!"
    });
  } catch (error) {
    logger.error("UserService - inviteMember() -> error : ", error);
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
  onboard,
  listMembers,
  inviteMember,
  updateProfile,
  updateWorkspace
};

module.exports = UserService;
