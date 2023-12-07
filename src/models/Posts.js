const mongoose = require("mongoose");
const { ChannelType } = require("../utils/constants");

const collection = "Posts";

const PostsSchema = new mongoose.Schema(
  {
    content: {
      type: String
    },
    channel: {
      type: String,
      enum: Object.values(ChannelType)
    },
    metadata: {
      type: mongoose.Schema.Types.Mixed
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Users",
      default: null
    },
    workspace: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Workspaces",
      default: null
    }
  },
  { timestamps: true, collection }
);

const PostsModel = mongoose.model(collection, PostsSchema);

module.exports = PostsModel;
