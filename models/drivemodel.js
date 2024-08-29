const mongoose = require("mongoose");
const { Schema } = mongoose;

const driveSchema = new Schema(
  {
    userId: {
      type: String,
      required: true,
    },
    filePath: {
      type: String,
      required: true,
    },
    fileType: {
      type: String,
      required: true,
    },
    name: {
        type: String,
        required: true
    },
    s3Url: {
        type: String,
    },
  },
  {
    timestamps: true
});

module.exports = driveSchema;