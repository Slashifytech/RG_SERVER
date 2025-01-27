// const mongoose = require('mongoose')
// const connectDb = require('../db/mongoConnection');
// const User = require('../model/User');
// const { encryptText } = require('../Utility/utilityFunc');


// (async () => {
//   try {
//     await connectDb()

//     const adminData = {
//       agentId: "admin@01",
//       agentName: "test name",
//       contact: "2356892356",
//       email: "theslashifytech@gamil.com",
//       roleType: "0",
//       password: encryptText("slashifytech0023"),
//       role: "0",
//     };

//     const admin = new User(adminData);
//     await admin.save();
//     console.log("Admin data saved successfully!");
//   } catch (error) {
//     console.error("Error saving admin data:", error);
//   } finally {
//     mongoose.connection.close();
//   }
// })();
