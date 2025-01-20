const express = require("express");
const { BuyBackFormData, updateBuyBackStatus, editBuyBack, buyBackById, getAllBuyBackLists } = require("../controllers/BuyBackController");
const router = express.Router();


router.post("/add-new-buy-back", BuyBackFormData);
router.patch("/update-buyback-status", updateBuyBackStatus);
// router.patch("/policy-resubmit", policyResubmit);
router.patch("/edit-buy-back/:id", editBuyBack);
router.get("/buy-back", buyBackById);
router.get("/buy-back-lists", getAllBuyBackLists);

// router.get("/policy", getPolicies);
// router.get("/filtered-policyById/:id", getFilteredPolicyById);

module.exports = router;
