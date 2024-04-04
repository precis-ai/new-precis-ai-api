const mongoose = require("mongoose");

const collection = "AITools";

const AIToolsSchema = new mongoose.Schema(
  {
    name: {
      type: String
    },
    description: {
      type: String
    },
    instructions: {
      type: String
    }
  },
  { timestamps: true, collection }
);

const AIToolsModel = mongoose.model(collection, AIToolsSchema);

module.exports = AIToolsModel;
