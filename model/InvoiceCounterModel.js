const mongoose = require('mongoose');

const invoiceCounterSchema = new mongoose.Schema({
  name: { type: String, required: true },
  count: { type: Number, default: 0 },
});

const InvoiceCounter = mongoose.model('InvoiceCounter', invoiceCounterSchema);
module.exports = InvoiceCounter
