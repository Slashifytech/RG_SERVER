const mongoose = require("mongoose");

const statusSchema = new mongoose.Schema({
  status: {
    type: String,
    // required: true,
    enum: ["send", "pending", "approved", "rejected"],
    default: "send",
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

const documentStatusSchema = new mongoose.Schema({
  agentApproval: {
    type: statusSchema,
  },
  clientApproval: {
    type: statusSchema,
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  customerName: {
    type: String,
  },
  message: {
    type: String,
  },
  email: {
    type: String,
  },
  invoiceId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Invoice",
  },
  policyId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Policy",
  },
});

const DocumentStatus = mongoose.model("documentStatus", documentStatusSchema);
module.exports = DocumentStatus;
