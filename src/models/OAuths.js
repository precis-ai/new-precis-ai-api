const mongoose = require("mongoose");
const { ChannelType } = require("../utils/constants");

const collection = "OAuths";

const OAuthsSchema = new mongoose.Schema(
  {
    platform: {
      type: String,
      default: null,
      enum: [...Object.values(ChannelType), null]
    },
    response: {
      type: mongoose.Schema.Types.Mixed,
      default: null
    },
    // for temporary access
    twitterAuthLinkResponse: {
      type: mongoose.Schema.Types.Mixed,
      default: null
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Users",
      default: null
    }
  },
  { timestamps: true, collection, minimize: false }
);

const OAuthsModel = mongoose.model(collection, OAuthsSchema);

module.exports = OAuthsModel;
