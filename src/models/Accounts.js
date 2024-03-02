const mongoose = require("mongoose");
const { ChannelType } = require("../utils/constants");

const collection = "Accounts";

const AccountsSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Users",
      default: null
    },
    platform: {
      type: String,
      default: null,
      enum: Object.values(ChannelType)
    },
    token: {
      type: String,
      default: null
    },
    refreshToken: {
      type: String,
      default: null
    },
    secret: {
      type: String,
      default: null
    },
    expire: {
      type: Date,
      default: null
    }
  },
  { timestamps: true, collection, minimize: false }
);

const AccountsModel = mongoose.model(collection, AccountsSchema);

module.exports = AccountsModel;