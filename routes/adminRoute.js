const express = require('express');
const router = express.Router();

const { addAgent, getMBagent, getMGagent, deleteAgent, getUserDataByBrand } = require("../controllers/UserController");
const { authCheck } = require('../middleware/Auth');

    router.post("/add-new-agent",authCheck, addAgent);
    router.delete("/deleteAgent/:id",authCheck, deleteAgent)

    router.get("/mb-agents",authCheck, getMBagent);
    router.get("/mg-agents",authCheck, getMGagent);
    router.get("/team-members",authCheck, getUserDataByBrand);


     

    
    module.exports = router;