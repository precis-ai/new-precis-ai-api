const mongoose = require("mongoose");

const collection = "Workspaces";

const WorkspacesSchema = new mongoose.Schema(
  {
    name: {
      type: String
    }
  },
  { timestamps: true, collection }
);

const WorkspacesModel = mongoose.model(collection, WorkspacesSchema);

module.exports = WorkspacesModel;
