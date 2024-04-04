const mongoose = require("mongoose");

const collection = "MarketingStrategies";

const MarketingStrategiesSchema = new mongoose.Schema(
  {
    name: {
      type: String
    },
    content: {
      type: [String]
    },
    strategy: {
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

const MarketingStrategiesModel = mongoose.model(
  collection,
  MarketingStrategiesSchema
);

module.exports = MarketingStrategiesModel;
