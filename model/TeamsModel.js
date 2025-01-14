const mongoose = require("mongoose");
const TeamSchema = mongoose.Schema(
  {
    location: {
      type: String,
      trim: true,
    },
    leadName: {
      type: String,
    },
    teamName: {
      type: String,
      required: true,
      trim: true,
    },
    employeeName: {
      type: String,
    },
  },
  {
    timestamps: true,
  }
);

const Teams = mongoose.model("teams", TeamSchema);
module.exports = Teams;
