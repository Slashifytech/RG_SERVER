const mongoose = require("mongoose");
const dotenv = require("dotenv");
dotenv.config();

// Database connection
const connectDb = function () {
  return mongoose
    .connect(process.env.MONGODB_URL)
    .then((connectionInstance) => {
      console.log(
        "database connected!!",
        connectionInstance.connection.host
      );
    })
    .catch((error) => {
      console.log("database connection error", error);
      throw error;
    });
};

module.exports = connectDb;
