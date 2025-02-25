const express = require("express");
const {
  BuyBackFormData,
  updateBuyBackStatus,
  editBuyBack,
  buyBackById,
  getAllBuyBackLists,
  buyBackResubmit,
  disableBuyBack,
  downloadBuyBackCsv,
  getBuyBackStats,
} = require("../controllers/BuyBackController");
const { authCheck } = require("../middleware/Auth");
const router = express.Router();

router.post("/add-new-buy-back", authCheck, BuyBackFormData);
router.patch("/update-buyback-status", authCheck, updateBuyBackStatus);
router.patch("/buyback-resubmit", authCheck, buyBackResubmit);
router.patch("/edit-buy-back/:id", authCheck, editBuyBack);
router.get("/buy-back", authCheck, buyBackById);
router.get("/buy-back-lists", authCheck, getAllBuyBackLists);
router.patch("/disable-buyBack", authCheck, disableBuyBack);
router.get("/buy-back-stats-data", authCheck, getBuyBackStats);
router.get("/buyBack-download",authCheck, downloadBuyBackCsv);


module.exports = router;
