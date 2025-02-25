const express = require("express");
const {
  AmcFormData,
  editAmc,
  amcDataById,
  getAllAmcList,
  updateAMCStatus,
  AMCResubmit,
  disableAmc,
  addExpenseData,
  getamcStats,
  downloadAmcCsv,
} = require("../controllers/AmcController");
const { authCheck } = require("../middleware/Auth");
const router = express.Router();

router.post("/add-new-amc",authCheck, AmcFormData);
router.post("/add-expense-amc",authCheck, addExpenseData);
router.patch("/update-amc-status",authCheck, updateAMCStatus);
router.patch("/amc-resubmit",authCheck, AMCResubmit);
router.patch("/edit-amc/:id",authCheck, editAmc);
router.patch("/disable-amc",authCheck, disableAmc);
router.get("/amcById",authCheck, amcDataById);
router.get("/amc-lists",authCheck, getAllAmcList);
router.get("/amc-stats-data",authCheck, getamcStats);
router.get("/amc-download",authCheck, downloadAmcCsv);



module.exports = router;
