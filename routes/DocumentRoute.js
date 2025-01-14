const express = require('express');
const router = express.Router();
const {
  getDocumentData,
  updateDocumentStatus,
  getStatusRequestForAgent,
  sendPolicyPdf,
  CustomerApproval,
} = require("../controllers/documentController");

router.patch("/document-status-update", updateDocumentStatus);
router.patch("/customer-document-approval", sendPolicyPdf); // send by admin

router.patch("/customer-approval", CustomerApproval); //approved by customer

router.get("/all-document", getDocumentData);

router.get("/agent-document-approval", getStatusRequestForAgent);

module.exports = router;
