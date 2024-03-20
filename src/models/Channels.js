const mongoose = require("mongoose");
const { ChannelType } = require("../utils/constants");

const collection = "Channels";

const ChannelsSchema = new mongoose.Schema(
  {
    userInfo: {
      type: {
        id: {
          type: String
        },
        name: {
          type: String
        },
        handle: {
          type: String
        },
        picture: {
          type: String
        }
      },
      default: null,
      _id: false
    },
    platform: {
      type: String,
      default: null,
      enum: [...Object.values(ChannelType), null]
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
    },
    deleted: {
      type: Boolean,
      default: false
    },
    oauth: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "OAuths",
      default: null
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Users",
      default: null
    }
  },
  { timestamps: true, collection }
);

const ChannelsModel = mongoose.model(collection, ChannelsSchema);

module.exports = ChannelsModel;
