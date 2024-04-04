const mongoose = require("mongoose");

const collection = "Workspaces";

const WorkspacesSchema = new mongoose.Schema(
  {
    name: {
      type: String
    },
    onboardingCompleted: {
      type: Boolean,
      default: false
    },
    socialAccountConnected: {
      type: Boolean,
      default: false
    },
    postSent: {
      type: Boolean,
      default: false
    },
    postScheduled: {
      type: Boolean,
      default: false
    },
    aiToolUsed: {
      type: Boolean,
      default: false
    },
    invitedTeamMembers: {
      type: Boolean,
      default: false
    }
  },
  { timestamps: true, collection }
);

const WorkspacesModel = mongoose.model(collection, WorkspacesSchema);

module.exports = WorkspacesModel;
