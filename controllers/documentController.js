const {
  documentApprovalToClient,
  documentApprovalToAgent,
  documentRejectedByAgent,
  documentApprovedByAgent,
} = require("../helper/emailFunction");
const {
  generatePdf,
  renderEmailTemplate,
  renderEmailInvoiceTemplate,
} = require("../helper/pdfDownlaod");
const DocumentStatus = require("../model/DocumentStatusModel");
const Invoice = require("../model/InvoiceModel");
const Policy = require("../model/Policies");
const User = require("../model/User");

exports.getDocumentData = async (req, res) => {
  try {
    const { page = 1, limit = 10, searchTerm } = req.query;
    const skip = (page - 1) * limit;
    const parsedLimit = parseInt(limit, 10);

    const searchCondition = searchTerm
      ? {
          $or: [
            { "invoiceDetails.invoiceId": { $regex: searchTerm, $options: "i" } },
            { policyId: { $regex: searchTerm, $options: "i" } },
            { customerName: { $regex: searchTerm, $options: "i" } },
          ],
        }
      : {};

    const commonData = await Policy.aggregate([
      // Match policies where policyStatus is approved
      {
        $match: {
          policyStatus: "approved",
        },
      },
      {
        $lookup: {
          from: "invoices",
          localField: "email",
          foreignField: "email",
          as: "invoiceDetails",
        },
      },
      {
        $unwind: {
          path: "$invoiceDetails",
          preserveNullAndEmptyArrays: false, // Exclude policies without invoice details
        },
      },
      // Match invoices where invoiceStatus is approved
      {
        $match: {
          "invoiceDetails.invoicestatus": "approved",
        },
      },
      {
        $lookup: {
          from: "documentstatuses",
          localField: "_id",
          foreignField: "policyId",
          as: "documentStatus",
        },
      },
      {
        $unwind: {
          path: "$documentStatus",
          preserveNullAndEmptyArrays: true, // Include policies without a documentStatus
        },
      },
      // Apply search condition
      {
        $match: searchCondition,
      },
      {
        $project: {
          commonEmail: "$email",
          customerName: "$customerName",
          agentId: "$userId",
          policyId: "$policyId",
          policyDbId: "$_id",
          invoiceId: "$invoiceDetails.invoiceId",
          invoiceDbId: "$invoiceDetails._id",
          documentStatus: {
            agentApproval: "$documentStatus.agentApproval",
            clientApproval: "$documentStatus.clientApproval",
            autoApproval: "$documentStatus.autoApproval",
          },
        },
      },
      {
        $skip: skip,
      },
      {
        $limit: parsedLimit,
      },
    ]);

    // Count total documents matching conditions
    const totalCount = await Policy.aggregate([
      {
        $match: {
          policyStatus: "approved",
        },
      },
      {
        $lookup: {
          from: "invoices",
          localField: "email",
          foreignField: "email",
          as: "invoiceDetails",
        },
      },
      {
        $unwind: {
          path: "$invoiceDetails",
          preserveNullAndEmptyArrays: false,
        },
      },
      {
        $match: {
          "invoiceDetails.invoicestatus": "approved",
        },
      },
      {
        $match: searchCondition,
      },
      {
        $count: "total",
      },
    ]);

    const totalItems = totalCount.length ? totalCount[0].total : 0;

    if (!commonData.length) {
      return res.status(404).json({ message: "No document found" });
    }

    // Return response
    return res.status(200).json({
      message: "Data fetched successfully",
      commonData,
      pagination: {
        totalItems,
        totalPages: Math.ceil(totalItems / parsedLimit),
        currentPage: parseInt(page, 10),
        itemsPerPage: parsedLimit,
      },
    });
  } catch (error) {
    console.error("Error fetching document data:", error);
    return res.status(500).json({
      message: "Something went wrong",
      error,
    });
  }
};



exports.updateDocumentStatus = async (req, res) => {
  const {
    invoiceId,
    policyId,
    customerName,
    agentApproval,
    clientApproval,
    autoApproval,
    message,
    email,
    userId,
  } = req.body;
  try {
    let documentStatus = await DocumentStatus.findOne({ invoiceId, policyId });

    if (!documentStatus) {
      documentStatus = new DocumentStatus({ invoiceId, policyId });
    }

    if (agentApproval) {
      documentStatus.agentApproval = {
        status: agentApproval,
        updatedAt: Date.now(),
      };
    }

    if (clientApproval) {
      documentStatus.clientApproval = {
        status: clientApproval,
        updatedAt: Date.now(),
      };
    }

    // if (autoApproval) {
    //   documentStatus.autoApproval = {
    //     status: autoApproval,
    //     updatedAt: Date.now(),
    //   };
    // }
    if (customerName) {
      documentStatus.customerName = customerName;
    }
    
    if (userId) {
      documentStatus.userId = userId;
    }
    await documentStatus.save();

    const policy = await Policy.findById(policyId);
    if (!policy) {
      return res.status(404).json({
        message: "Policy not found",
      });
    }
    const invoice = await Invoice.findById(invoiceId);
    if (!invoice) {
      return res.status(404).json({
        message: "Invoice not found",
      });
    }
    const user = await User.findById(policy.userId);
    if (!user) {
      return res.status(404).json({
        message: "User not found",
      });
    }

    const agentName = user.agentName;
    const agentEmail = user.email;
    if (agentApproval === "pending") {
      await documentApprovalToAgent(agentEmail, agentName, invoice.invoiceId, policy.policyId);
    }

    if (agentApproval === "rejected") {
      await documentRejectedByAgent(agentName, message, invoice.invoiceId, policy.policyId);
    }
    if (agentApproval === "approved") {
      await documentApprovedByAgent(agentName, invoice.invoiceId, policy.policyId);
    }
    return res.status(200).json({
      message: "Document status updated successfully",
      data: documentStatus,
    });
  } catch (error) {
    console.error("Error updating document status:", error);
    return res.status(500).json({
      message: "Something went wrong",
      error,
    });
  }
};

exports.getStatusRequestForAgent = async (req, res) => {
  try {
    const { page = 1, limit = 10, userId } = req.query;

    const skip = (page - 1) * limit;

    const data = await DocumentStatus.find({
      "agentApproval.status": "pending",
      userId: userId
    })
      .skip(skip)
      .limit(Number(limit));

    const totalRecords = await DocumentStatus.countDocuments({
      "agentApproval.status": "pending",
    });
    const totalPages = Math.ceil(totalRecords / limit);

    if (!data || data.length === 0) {
      return res.status(404).json({ message: "No data available" });
    }

    return res.status(200).json({
      message: "Data fetched successfully",
      data,
      pagination: {
        currentPage: Number(page),
        totalPages,
        totalRecords,
        pageSize: Number(limit),
      },
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Something went wrong", error });
  }
};

exports.sendPolicyPdf = async (req, res) => {
  const { invoiceId, policyId, customerName, clientApproval, email } = req.body;
  try {
    let documentStatus = await DocumentStatus.findOne({ invoiceId, policyId });

    if (!documentStatus) {
      documentStatus = new DocumentStatus({ invoiceId, policyId });
    }

    if (clientApproval) {
      documentStatus.clientApproval = {
        status: clientApproval,
        updatedAt: Date.now(),
      };
    }

    if (customerName) {
      documentStatus.customerName = customerName;
    }

    if (email) {
      documentStatus.email = email;
    }
    await documentStatus.save();

    const policy = await Policy.findOne({ email });
    const invoice = await Invoice.findOne({ email });
    if (!policy && !invoice) {
      return res
        .status(404)
        .json({ message: "Policy and Invoice not found for thi user" });
    }
    if (clientApproval === "pending") {
      // Generate HTML and PDF
      const policyHtml = await renderEmailTemplate(policy);
      const invoiceHtml = await renderEmailInvoiceTemplate(invoice);
      const pdfPolicyBuffer = await generatePdf(policyHtml, "pdfPolicy");
      const pdfInvoiceBuffer = await generatePdf(invoiceHtml, "pdfInvoice");
      const policyFilename = `${policy.policyId}_${
        policy.customerName || "Policy"
      }.pdf`;
      const invoiceFilename = `${invoice.invoiceId}_${
        policy.customerName || "Policy"
      }.pdf`;
      await documentApprovalToClient(
        email,
        policy.customerName,
        invoice.invoiceId,
        pdfPolicyBuffer,
        pdfInvoiceBuffer,
        policyFilename,
        invoiceFilename,
        policy.policyId
      );
    }
    return res.status(200).json({ message: "Status Updated Successfully" });
  } catch (error) {
    console.error("Error in sending PDF:", error);
    return res.status(500).json({ message: "Something went wrong", error });
  }
};

exports.CustomerApproval = async (req, res) => {
  const { clientApproval, email } = req.body;
  try {
    let documentStatus = await DocumentStatus.findOne({ email });
    if (!documentStatus) {
      return res
        .status(404)
        .json({
          message:
            "Email not Found, Please enter policy and invoice generated email id",
        });
    }

    if (clientApproval) {
      documentStatus.clientApproval = {
        status: clientApproval,
        updatedAt: Date.now(),
      };
    }

    if (email) {
      documentStatus.email = email;
    }
    await documentStatus.save();

    return res.status(200).json({ message: "Approved Success" });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Something went wrong", error });
  }
};
