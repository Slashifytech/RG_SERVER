const mongoose = require("mongoose");
const { customerPersonalDetais } = require("./AmcModel");

const vehicleDetailsSchema = mongoose.Schema({
  vehicleModel: {
    type: String,
    required: false,
  },
  vinNumber: {
    type: String,
    required: false,
  },
  fuelType: {
    type: String,
    required: false,
  },
  agreementStartDate: {
    type: String,
    required: false,
  },
  agreementValidDate: {
    type: String,
    required: false,
  },
  deliveryDate: {
    type: String,
    required: false,
  },
  validityMilage: {
    type: String,
    required: false,
  },
  totalPayment: {
    type: String,
    required: false,
  },
  gmEmail: {
    type: String,
  },
  rmEmail: {
    type: String,
  },
});

const BuyBackSchema = mongoose.Schema(
  {
    customerDetails: customerPersonalDetais,
    vehicleDetails: vehicleDetailsSchema,
    buyBackStatus: {
      type: String,
      enum: ["pending", "approved", "rejected"],
      default: "pending",
    },
    customId:{
      type: String,
      required: true,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    isCancelReq: {
      type: String,
      enum: ["noReq", "reqCancel", "approvedReq"],
      default: "noReq",
    },
    approvedAt: {
      type: Date,
      required: false,
    },
    rejectedAt: {
      type: Date,
      required: false,
    },
    disabledAt: {
      type: Date,
      required: false,
    },
    isDisabled: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

const BuyBacks = mongoose.model("BuyBacks", BuyBackSchema);

module.exports = BuyBacks;
