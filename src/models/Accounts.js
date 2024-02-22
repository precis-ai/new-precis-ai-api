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
      type: mongoose.Schema.Types.ObjectId,
      default: null,
      enum: Object.values(ChannelType)
    },
    token: {
      type: String
    },
    secret: {
      type: String,
      default: null
    }
  },
  { timestamps: true, collection, minimize: false }
);

const AccountsModel = mongoose.model(collection, AccountsSchema);

module.exports = AccountsModel;
