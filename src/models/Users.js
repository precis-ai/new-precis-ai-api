const mongoose = require("mongoose");
const { UserRoles } = require("../utils/constants");

const collection = "Users";

const UsersSchema = new mongoose.Schema(
  {
    role: {
      type: String,
      enum: Object.values(UserRoles)
    },
    firstName: {
      type: String
    },
    lastName: {
      type: String
    },
    email: {
      type: String,
      index: true
    },
    password: {
      type: String
    },
    avatar: {
      type: String
    },
    workspace: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Workspaces",
      default: null
    }
  },
  { timestamps: true, collection, minimize: false }
);

const UsersModel = mongoose.model(collection, UsersSchema);

module.exports = UsersModel;
