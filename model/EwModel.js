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
  dealerLocation: {
    type: String,
    required: false,
  },

  saleDate: {
    type: String,
    required: false,
  },

  deliveryDate: {
    type: String,
    required: false,
  },
  presentKm: {
    type: String,
    required: false,
  },
  warrantyLimit: {
    type: String,
    required: false,
  },
  engineNumber: {
    type: String,
  },
 
  registrationNumber:{
    type:String
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
    gmEmail: {
      type: String,
    },

});
const ewPolicySchema = mongoose.Schema({

  policyDate: {
    type: String,
  },
  warrantyAmount: {
    type: String,
  },
  planType: {
    type: String,
  },
  planSubType: {
    type: String,
  },
  registrationType: {
    type: String,
  },
  warrantyCoveragePeriod: {
    type: String,
  },
  startKm: {
    type: String,
  },
  endKm: {
    type: String,
  },
  ewStatus: {
    type: String,
  },

});
const ewSchema = mongoose.Schema(
  {
    customerDetails: customerPersonalDetais,
    vehicleDetails: vehicleDetailsSchema,
    ewDetails: ewPolicySchema,
    ewStatus: {
      type: String,
      enum: ["pending", "approved", "rejected"],
      default: "pending",
    },

    customId: {
      type: String,
      required: true,
    },
    backendPolicyId: {
      type: String,
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

const EwPolicy = mongoose.model("EwPolicy", ewSchema);

module.exports = EwPolicy;
