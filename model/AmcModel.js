const mongoose = require("mongoose");

const customerPersonalDetais = mongoose.Schema({
  customerName: {
    type: String,
    required: false,
  },
  address: {
    type: String,
    required: false,
  },
  contact: {
    type: String,
    required: false,
  },
  email: {
    type: String,
    required: false,
  },
  pan: {
    type: String,
    required: false,
  },
  customerGst: {
    type: String,
    required: false,
  },
  zipCode: {
    type: String,
    required: false,
  },
  stateCode: {
    type: String,
    required: false,
  },
});

const amcVehicleDetailSchema = mongoose.Schema({
  model: {
    type: String,
  },
  fuelType: {
    type: String,
  },

  vinNumber: {
    type: String,
  },

  agreementPeriod: {
    type: String,
  },
  agreementStartDate: {
    type: String,
  },
  agreementValidDate: {
    type: String,
  },
  agreementStartMilage: {
    type: String,
  },
  agreementValidMilage: {
    type: String,
  },
  MaximumValidPMS: {
    type: String,
  },
  dealerLocation: {
    type: String,
  },
  total: {
    type: String,
  },
  gmEmail: {
    type: String,
  },
  rmName: {
    type: String,
  },
  rmEmployeeId: {
    type: String,
  },
  rmEmail: {
    type: String,
  },
});

const AMCschema = mongoose.Schema(
  {
    customerDetails: customerPersonalDetais,
    vehicleDetails: amcVehicleDetailSchema,
    amcStatus: {
      type: String,
      enum: ["pending", "approved", "rejected"],
      default: "pending",
    },
    customId: {
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

const AMCs = mongoose.model("AMCs", AMCschema);
module.exports = {
  AMCs,
  customerPersonalDetais,
};
