const mongoose = require("mongoose");

const counterSchema = new mongoose.Schema({
  name: { type: String, required: true },
  count: { type: Number, default: 0 },
});

const invoiceCounterSchema = new mongoose.Schema({
  amcCounter: counterSchema,
  buyBackCounter: counterSchema,
});

const InvoiceCounter = mongoose.model("InvoiceCounter", invoiceCounterSchema);
module.exports = InvoiceCounter;
