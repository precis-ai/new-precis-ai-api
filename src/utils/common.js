const mongoose = require("mongoose");

const newId = () => mongoose.Types.ObjectId();

const newIdString = () => mongoose.Types.ObjectId().toHexString();

const waitForMilliSeconds = ms =>
  new Promise(resolve => setTimeout(resolve, ms));

module.exports = {
  newId,
  newIdString,
  waitForMilliSeconds
};
