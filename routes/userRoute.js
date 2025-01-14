const express = require("express");
const router = express.Router();
const { cancelFromAgentRequest } = require("../controllers/PoliciesController");
const {
  signinController,
  getUsersData,
  getUserById,
  getUserDataById,
} = require("../controllers/UserController");
const { authCheck } = require("../middleware/Auth");

router.post("/auth", signinController);
router.put("/cancel-request/:id", cancelFromAgentRequest);

router.get("/getUserData", authCheck, getUsersData);
router.get("/getUserDataById/:userId", getUserById);
router.get("/getAllUserDataById/:userId", getUserDataById);
module.exports = router;
