const mongoose = require("mongoose");
const { customerPersonalDetais } = require("./AmcModel");

const vehicleDetailSchema = mongoose.Schema({
  hypothecated: {
    type: String,
    required: false,
  },
  branchName: {
    type: String,
    required: false,
  },
  model: {
    type: String,
    required: false,
  },
  vinNumber: {
    type: String,
    required: false,
  },
  gstAmount: {
    type: String,
    required: false,
  },
  cgst: {
    type: String,
    required: false,
  },
  sgst: {
    type: String,
    required: false,
  },
  totalAmount: {
    type: String,
    required: false,
  },
  gmEmail: {
    type: String,
  },
  rmEmail:{
    type: String,
  }
});
const invoiceSchema = mongoose.Schema(
  {
    invoiceType: {
      type: String,
    },
    serviceId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      refPath: "serviceType",
    },
    serviceType: {
      type: String,
      required: true,
      enum: ["BuyBacks", "AMCs"],
    },

    billingDetail: customerPersonalDetais,
    shippingDetails: customerPersonalDetais,
    vehicleDetails: vehicleDetailSchema,

 
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
   
    invoiceId: { type: String, required: true, unique: true },
  },
  { timestamps: true }
);

const Invoice = mongoose.model("invoice", invoiceSchema);
module.exports = Invoice;
