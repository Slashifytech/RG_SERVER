const express = require("express");
const router = express.Router();
const {
  getTeamData,
  updateTeamData,
} = require("../controllers/teamDataController");

router.get("/getTeams", getTeamData);
router.patch("/update-team", updateTeamData);
module.exports = router;
