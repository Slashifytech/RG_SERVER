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

// Define routes
router.post('/add-invoice', addInvoice);
router.patch('/update-invoice', editInvoice);
router.patch('/update-approval', invoiceApproval);
router.get('/all-invoice-approval', getAllInvoice);
router.get('/invoice-all', getInvoicesByStatus);
router.get('/invoice', invoiceById);
router.patch('/invoice-resubmit', invoiceResubmit);

// Export the router
module.exports = router;
