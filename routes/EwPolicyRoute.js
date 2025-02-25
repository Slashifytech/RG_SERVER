const express = require("express");
const { authCheck } = require("../middleware/Auth");
const { ewPolicyFormData, updateEwStatus, EwResubmit, editEwPolicy, disableEwPolicy, ewById, getAllEwLists, downloadEwCsv, getEwStats } = require("../controllers/ewController");
const router = express.Router();

router.post("/add-new-ew",authCheck, ewPolicyFormData);
router.patch("/update-ew-status",authCheck, updateEwStatus);
router.patch("/ew-resubmit",authCheck, EwResubmit);
router.patch("/edit-ew-policy/:id",authCheck, editEwPolicy);
router.patch("/disable-ew",authCheck, disableEwPolicy);
router.get("/ew-policy",authCheck, ewById);
router.get("/ew-lists",authCheck, getAllEwLists);
router.get("/ew-download",authCheck, downloadEwCsv);
router.get("/ew-stats",authCheck, getEwStats);



module.exports = router;
