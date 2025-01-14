const mongoose = require("mongoose");

const customerBillingSchema = mongoose.Schema({
  description: {
    type: String,
  },
  hsnCode: {
    type: String,
  },
  quantity: {
    type: String,
  },
  rate: {
    type: String,
  },
  total: {
    type: String,
  },
  discount: {
    type: String,
  },
  taxValue: {
    type: String,
  },
  cgstpercentage: {
    type: String,
  },
  cgst: {
    type: String,
  },
  sgstpercentage: {
    type: String,
  },
  sgst: {
    type: String,
  },
  igst: {
    type: String,
  },
  igstpercentage: {
    type: String,
  },
  ugst: {
    type: String,
  },
  ugstpercentage: {
    type: String,
  },
  cesspercentage: {
    type: String,
  },
  cess: {
    type: String,
  },
  totalinvoiceamount: {
    type: String,
  },
  totalpriceinvalue: {
    type: String,
  },

});
const billingDetailSchema = mongoose.Schema({
  address: {
    type: String,
  },
  city: {
    type: String,
  },
  state: {
    type: String,
  },
  country: {
    type: String,
  },
  zipCode: {
    type: String,
  },
  stateCode: {
    type: String,
  },
  pan: {
    type: String,
  },
  contact: {
    type: String,
  },
  gstInNumber: {
    type: String,
  },
  gstRegType: {
    type: String,
  },
});

const vehicleDetailSchema = mongoose.Schema({
  vehnumber: {
    type: String,
  },
  vinnumber: {
    type: String,
  },
  enginenumber: {
    type: String,
  },
  vehiclemodel: {
    type: String,
  },
  totalpriceinfigure: {
    type: String,
  },
  totalpriceinvalue: {
    type: String,
  },
  reversechargeapplication: {
    type: String,
  },
  warrantystartdate: {
    type: String,
  },
  warrantyenddate: {
    type: String,
  },
});
const invoiceSchema = mongoose.Schema({
  invoiceType: {
    type: String,
  },
  email: {
    type: String,
  },
  billingDetail: billingDetailSchema,
  deliveryDetails: billingDetailSchema,
  supplyDetails: billingDetailSchema,
  customerBillingDetails: customerBillingSchema,
  vehicleDetails: vehicleDetailSchema,
  invoicecopydocument: {
    type: String,
  },
  pancard: {
    type: String,
  },
  gstcertificate: {
    type: String,
  },
  paymentproof: {
    type: String,
  },
  invoicestatus:{
    type: String,
    enum: ["yetToApproved", "approved", "rejected"],
    default: "yetToApproved",
  },
  createdBy:{
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  approvedAt: {
    type: Date,
    default: new Date().toISOString(),
    required: false,
  },
  rejectedAt: {
    type: Date, 
    required: false
  },
  rejectionReason:{type: String, required: false, },
  invoiceId: { type: String, required: true, unique: true },


},
{ timestamps: true }

);

const Invoice = mongoose.model("invoice", invoiceSchema)
module.exports = Invoice;