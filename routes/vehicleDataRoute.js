const express = require('express');
const router = express.Router();
const { getMbOptions, getMgOptions } = require("../controllers/PoliciesController");


router.get("/mgOptions", getMgOptions);
router.get("/mbOptions", getMbOptions);

module.exports = router;