const express = require('express');
const router = express.Router();

const { getPendingPolicy, updatePolicyStatus,  disablePolicy, getCancelledPolicy, getAllPolicy, getAllPolicyCount, getCancelledPolicyCount, downloadPolicyCsv } = require("../controllers/PoliciesController");
const { addAgent, getMBagent, getMGagent, deleteAgent, getUserDataByBrand } = require("../controllers/UserController");

    router.post("/add-new-agent", addAgent);
    router.put("/policyStatus", updatePolicyStatus)
    router.put("/cancelPolicy/:policyId", disablePolicy)

    router.delete("/deleteAgent/:id", deleteAgent)

    router.get("/mb-agents", getMBagent);
    router.get("/mg-agents", getMGagent);
    router.get("/team-members", getUserDataByBrand);
    router.get("/pendingPolicy", getPendingPolicy)
    router.get("/get-cancelled-policy", getCancelledPolicy)
    router.get("/get-all-policy", getAllPolicy)
    router.get("/getPolicy-count", getAllPolicyCount)
    router.get("/getCancelledPolicy-count", getCancelledPolicyCount)
    router.get("/downloadCSV",downloadPolicyCsv)


     

    
    module.exports = router;