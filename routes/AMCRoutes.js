const express = require("express");
const { AmcFormData, editAmc, amcDataById, getAllAmcList, updateAMCStatus } = require("../controllers/AmcController");
const router = express.Router();


router.post("/add-new-amc", AmcFormData);
router.patch("/update-amc-status", updateAMCStatus);
// router.patch("/policy-resubmit", policyResubmit);
router.patch("/edit-amc/:id", editAmc);
router.get("/amcById", amcDataById);
router.get("/amc-lists", getAllAmcList);

// router.get("/policy", getPolicies);
// router.get("/filtered-policyById/:id", getFilteredPolicyById);

module.exports = router;
