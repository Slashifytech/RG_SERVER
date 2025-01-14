const express = require("express");
const router = express.Router();
const {
  updatePolicyStatus,
  policyFormData,
  getPolicyById,
  getFilteredPolicyById,
  editPolicy,
  policyResubmit,
  getPolicies,
} = require("../controllers/PoliciesController");

router.post("/add-policies", policyFormData);
router.post("/approval", updatePolicyStatus);
router.patch("/policy-resubmit", policyResubmit);
router.patch("/edit-policies/:id", editPolicy);
router.get("/policyById/:id", getPolicyById);
router.get("/policy", getPolicies);
router.get("/filtered-policyById/:id", getFilteredPolicyById);

module.exports = router;
