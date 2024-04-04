const mongoose = require("mongoose");

const collection = "AIToolsUsageHistory";

const AIToolsUsageHistorySchema = new mongoose.Schema(
  {
    content: {
      type: String
    },
    response: {
      type: mongoose.Schema.Types.Mixed // anthropic
    },
    result: {
      type: String
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Users",
      default: null
    },
    aiTool: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "AITools",
      default: null
    }
  },
  { timestamps: true, collection }
);

const AIToolsUsageHistoryModel = mongoose.model(
  collection,
  AIToolsUsageHistorySchema
);

module.exports = AIToolsUsageHistoryModel;
