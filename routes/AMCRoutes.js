const express = require("express");
const {
  AmcFormData,
  editAmc,
  amcDataById,
  getAllAmcList,
  updateAMCStatus,
  AMCResubmit,
  disableAmc,
} = require("../controllers/AmcController");
const router = express.Router();

router.post("/add-new-amc", AmcFormData);
router.patch("/update-amc-status", updateAMCStatus);
router.patch("/amc-resubmit", AMCResubmit);
router.patch("/edit-amc/:id", editAmc);
router.get("/amcById", amcDataById);
router.get("/amc-lists", getAllAmcList);
router.patch("/disable-amc", disableAmc);

module.exports = router;
