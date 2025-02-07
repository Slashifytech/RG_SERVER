const mongoose = require('mongoose')
const connectDb = require('../db/mongoConnection');
const User = require('../model/User');
const { encryptText } = require('../Utility/utilityFunc');


(async () => {
  try {
    await connectDb()

    const adminData = {
      agentId: "admin@01",
      agentName: "Dinesh Pathiwada",
      contact: "2356856232",
      email: "dineshpathiwada@mghyderabad.com",
      roleType: "0",
      password: encryptText("mghyderabad@123"),
      role: "0",
    };

    const admin = new User(adminData);
    await admin.save();
    console.log("Admin data saved successfully!");
  } catch (error) {
    console.error("Error saving admin data:", error);
  } finally {
    mongoose.connection.close();
  }
})();
