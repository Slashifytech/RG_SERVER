const express = require("express");
const {
  BuyBackFormData,
  updateBuyBackStatus,
  editBuyBack,
  buyBackById,
  getAllBuyBackLists,
  buyBackResubmit,
  disableBuyBack,
} = require("../controllers/BuyBackController");
const router = express.Router();

router.post("/add-new-buy-back", BuyBackFormData);
router.patch("/update-buyback-status", updateBuyBackStatus);
router.patch("/buyback-resubmit", buyBackResubmit);
router.patch("/edit-buy-back/:id", editBuyBack);
router.get("/buy-back", buyBackById);
router.get("/buy-back-lists", getAllBuyBackLists);
router.patch("/disable-buyBack", disableBuyBack);

module.exports = router;
