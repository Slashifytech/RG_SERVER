const express = require('express');
const router = express.Router();
const {
  addInvoice,
  editInvoice,
  getAllInvoice,
  invoiceApproval,
  getInvoicesByStatus,
  invoiceById,
  invoiceResubmit,
} = require('../controllers/invoiceController');
const { authCheck } = require('../middleware/Auth');

// Define routes
router.post('/add-invoice',authCheck, addInvoice);
router.patch('/update-invoice',authCheck, editInvoice);
router.patch('/update-approval',authCheck, invoiceApproval);
router.get('/all-invoice-approval',authCheck, getAllInvoice);
router.get('/invoice-all',authCheck, getInvoicesByStatus);
router.get('/invoice',authCheck, invoiceById);
router.patch('/invoice-resubmit',authCheck, invoiceResubmit);

// Export the router
module.exports = router;
