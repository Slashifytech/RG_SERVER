const {
  invoiceApproved,
  invoiceRejected,
  sendDocEmail,
  sendCustomerDocEmail,
} = require("../helper/emailFunction");
const Invoice = require("../model/InvoiceModel");
const InvoiceCounter = require("../model/InvoiceCounterModel");
const { generatePdf, renderEmailTemplate } = require("../helper/pdfDownlaod");
const { AMCs } = require("../model/AmcModel");
const BuyBacks = require("../model/BuyBackModel");
const User = require("../model/User");

exports.addInvoice = async (req, res) => {
  const { invoiceType, createdBy, ...payload } = req.body;
  const vinNumber = req.body.vehicleDetails.vinNumber;
  const rmEmail = req.body.vehicleDetails.rmEmail;
  const gmEmail = req.body.vehicleDetails.gmEmail;

  try {
    const existingVinNumber = await Invoice.findOne({
      "vehicleDetails.vinNumber": vinNumber,
    });
    if (existingVinNumber) {
      return res.status(400).json({ message: "VIN number already exists" });
    }

    let prefix;
    let serviceType;
    let counterField;

    const invoiceTypeData = invoiceType.toLowerCase();

    if (invoiceTypeData === "amc") {
      prefix = "AMC";
      serviceType = "AMCs";
      counterField = "amcCounter";
    } else if (invoiceTypeData === "buyback") {
      prefix = "BYBK";
      serviceType = "BuyBacks";
      counterField = "buyBackCounter";
    } else {
      return res.status(400).json({ message: "Invalid invoice type" });
    }

    const counter = await InvoiceCounter.findOneAndUpdate(
      {},
      { $inc: { [`${counterField}.count`]: 1 } },
      { new: true, upsert: true }
    );

    if (!counter) {
      return res.status(500).json({ message: "Counter update failed" });
    }

    const paddedCount = String(counter[counterField].count).padStart(3, "0");
    const invoiceId = `${prefix}-${paddedCount}`;

    const newInvoice = new Invoice({
      invoiceId,
      serviceType,
      invoiceType,
      createdBy,
      ...payload,
    });

    await newInvoice.save();
    let amcData;
    let buyBackData;
    let amcFileName;
    let buyBackFileName;
    let pdfBuybackBuffer;
    let pdfAmcBuffer;

    if (invoiceTypeData === "amc") {
      amcData = await AMCs.findOne({ "vehicleDetails.vinNumber": vinNumber });
      const amcHTML = await renderEmailTemplate(
        amcData,
        "../Templates/AmcTemplate.ejs"
      );
      pdfAmcBuffer = await generatePdf(amcHTML, "pdfAmc");
      amcFileName = `${amcData.vehicleDetails.vinNumber}_${
        amcData.customerDetails.customerName || "AMC"
      }.pdf`;
    } else if (invoiceTypeData === "buyback") {
      buyBackData = await BuyBacks.findOne({
        "vehicleDetails.vinNumber": vinNumber,
      });
      const buyBackHTML = await renderEmailTemplate(
        buyBackData,
        "../Templates/BuyBackTemplate.ejs"
      );
      pdfBuybackBuffer = await generatePdf(buyBackHTML, "pdfbuyBack");
      buyBackFileName = `${buyBackData?.vehicleDetails?.vinNumber}_${
        buyBackData?.customerDetails?.customerName || "Buyback"
      }.pdf`;
    }
    const invoiceData = await Invoice.findOne({
      "vehicleDetails.vinNumber": vinNumber,
    });
    const invoiceHTML = await renderEmailTemplate(
      invoiceData,
      "../Templates/InvoicePdf.ejs"
    );
    const pdfInvoiceBuffer = await generatePdf(invoiceHTML, "pdfInvoice");

    const invoiceFilename = `${invoiceData.invoiceId}_${
      invoiceData.customerName || "Invoice"
    }.pdf`;
    const policyType =
      invoiceTypeData === "amc"
        ? "AMC"
        : invoiceTypeData === "buyback"
        ? "Buyback"
        : null;
    const pdfPolicyBuffer =
      invoiceTypeData === "amc"
        ? pdfAmcBuffer
        : invoiceTypeData === "buyback"
        ? pdfBuybackBuffer
        : null;
    const policyFileName =
      invoiceTypeData === "amc"
        ? amcFileName
        : invoiceTypeData === "buyback"
        ? buyBackFileName
        : null;
        const policyData =   invoiceTypeData === "amc"
        ? amcData
        : invoiceTypeData === "buyback"
        ? buyBackData
        : null;
    const agentData = await User.findOne({ _id: policyData.createdBy });
    await sendDocEmail(
      policyType,
      invoiceData.vehicleDetails.vinNumber,
      invoiceData.invoiceId,
      invoiceData.billingDetail.customerName,
      pdfPolicyBuffer,
      pdfInvoiceBuffer,
      policyFileName,
      invoiceFilename,
      rmEmail,
      gmEmail,
      agentData.email,
      agentData.agentName,
       policyData.customId
      

    );
    await sendCustomerDocEmail(
      invoiceData.billingDetail.customerName,
      invoiceData.billingDetail.email,
      policyType,
      invoiceData.vehicleDetails.vinNumber,
      invoiceData.invoiceId,
      pdfPolicyBuffer,
      pdfInvoiceBuffer,
      policyFileName,
      invoiceFilename,
       policyData.customId,
       rmEmail,
       gmEmail,
       agentData.email,
    );
    res
      .status(201)
      .json({ message: "Invoice added successfully", data: newInvoice });
  } catch (error) {
    console.error("Error adding invoice:", error);
    res.status(500).json({ message: "Something went wrong" });
  }
};

exports.editInvoice = async (req, res) => {
  const { id } = req.query;
  const { ...payload } = req.body;
  const { rmEmail, gmEmail, vinNumber } = req.body.vehicleDetails || {};
  try {
    if (!id) {
      console.error("Invoice ID is missing in the query.");
      return res.status(400).json({ message: "Invoice ID is required" });
    }

    // console.log("Invoice ID:", id);

    const existingInvoice = await Invoice.findById(id);
    if (!existingInvoice) {
      console.error("Invoice not found for ID:", id);
      return res.status(404).json({ message: "Invoice not found" });
    }

    const invoiceTypeData = existingInvoice.invoiceType.toLowerCase();

    // Check for VIN number duplication
    if (vinNumber && vinNumber !== existingInvoice.vehicleDetails?.vinNumber) {
      const vinNumberExists = await Invoice.findOne({
        "vehicleDetails.vinNumber": vinNumber,
      });
      if (vinNumberExists) {
        return res
          .status(400)
          .json({ message: "VIN number is already in use" });
      }
    }
    Object.assign(existingInvoice, payload);

    try {
      await existingInvoice.save();

      let amcData;
      let buyBackData;
      let amcFileName;
      let buyBackFileName;
      let pdfBuybackBuffer;
      let pdfAmcBuffer;

      if (invoiceTypeData === "amc") {
        amcData = await AMCs.findOne({ "vehicleDetails.vinNumber": vinNumber });
        const amcHTML = await renderEmailTemplate(
          amcData,
          "../Templates/AmcTemplate.ejs"
        );
        pdfAmcBuffer = await generatePdf(amcHTML, "pdfAmc");
        amcFileName = `${amcData.vehicleDetails.vinNumber}_${
          amcData.customerDetails.customerName || "AMC"
        }.pdf`;
      } else if (invoiceTypeData === "buyback") {
        buyBackData = await BuyBacks.findOne({
          "vehicleDetails.vinNumber": vinNumber,
        });
        const buyBackHTML = await renderEmailTemplate(
          buyBackData,
          "../Templates/BuyBackTemplate.ejs"
        );
        pdfBuybackBuffer = await generatePdf(buyBackHTML, "pdfbuyBack");
        buyBackFileName = `${buyBackData?.vehicleDetails?.vinNumber}_${
          buyBackData?.customerDetails?.customerName || "Buyback"
        }.pdf`;
      }
      const invoiceData = await Invoice.findOne({
        "vehicleDetails.vinNumber": vinNumber,
      });
      const invoiceHTML = await renderEmailTemplate(
        invoiceData,
        "../Templates/InvoicePdf.ejs"
      );
      const pdfInvoiceBuffer = await generatePdf(invoiceHTML, "pdfInvoice");

      const invoiceFilename = `${invoiceData.invoiceId}_${
        invoiceData.customerName || "Invoice"
      }.pdf`;
      const policyType =
        invoiceTypeData === "amc"
          ? "AMC"
          : invoiceTypeData === "buyback"
          ? "Buyback"
          : null;
      const pdfPolicyBuffer =
        invoiceTypeData === "amc"
          ? pdfAmcBuffer
          : invoiceTypeData === "buyback"
          ? pdfBuybackBuffer
          : null;
      const policyFileName =
        invoiceTypeData === "amc"
          ? amcFileName
          : invoiceTypeData === "buyback"
          ? buyBackFileName
          : null;
          const policyData =   invoiceTypeData === "amc"
          ? amcData
          : invoiceTypeData === "buyback"
          ? buyBackData
          : null;
      const agentData = await User.findOne({ _id: policyData.createdBy });

      // await sendDocEmail(
      //   policyType,
      //   invoiceData.vehicleDetails.vinNumber,
      //   invoiceData.invoiceId,
      //   invoiceData.billingDetail.customerName,
      //   pdfPolicyBuffer,
      //   pdfInvoiceBuffer,
      //   policyFileName,
      //   invoiceFilename,
      //   rmEmail,
      //   gmEmail,
      //   agentData.email,
      //   agentData.agentName,
      //   policyData.customId
      // );

      await sendCustomerDocEmail(
        invoiceData.billingDetail.customerName,
        invoiceData.billingDetail.email,
        policyType,
        invoiceData.vehicleDetails.vinNumber,
        invoiceData.invoiceId,
        pdfPolicyBuffer,
        pdfInvoiceBuffer,
        policyFileName,
        invoiceFilename,
        policyData.customId,
        rmEmail,
        gmEmail,
        agentData.email,
      );
    } catch (saveError) {
      console.error("Error saving invoice:", saveError);
      return res.status(500).json({
        message: "Error saving invoice",
        error: saveError.message,
      });
    }

    res.status(200).json({
      message: "Invoice updated successfully",
      data: existingInvoice,
    });
  } catch (error) {
    console.error("Error in editInvoice:", error);
    res
      .status(500)
      .json({ message: "Something went wrong", error: error.message });
  }
};

exports.getAllInvoice = async (req, res) => {
  const { page = 1, limit = 10 } = req.query;

  try {
    const pageNumber = parseInt(page, 10);
    const pageSize = parseInt(limit, 10);
    const startIndex = (pageNumber - 1) * pageSize;
    const endIndex = pageNumber * pageSize;

    const totalInvoicesCount = await Invoice.countDocuments(query);

    const invoices = await Invoice.find(query)
      .sort({ createdAt: -1 })
      .limit(pageSize)
      .skip(startIndex);

    const data = {
      invoiceData: invoices,
      currentPage: pageNumber,
      hasNextPage: endIndex < totalInvoicesCount,
      hasPreviousPage: pageNumber > 1,
      nextPage: endIndex < totalInvoicesCount ? pageNumber + 1 : null,
      previousPage: pageNumber > 1 ? pageNumber - 1 : null,
      totalPagesCount: Math.ceil(totalInvoicesCount / pageSize),
      totalInvoicesCount,
    };

    res.status(200).json({
      message: "Invoices fetched successfully",
      data,
    });
  } catch (err) {
    console.error("Error fetching invoices:", err);
    res.status(500).json({
      message: "Something went wrong while fetching invoices",
      error: err.message,
    });
  }
};
exports.getInvoicesByStatus = async (req, res) => {
  const {
    page = 1,
    limit = 10,
    invoiceType,
    searchTerm,
    createdBy,
  } = req.query;

  try {
    const pageNumber = Math.max(1, parseInt(page, 10));
    const pageSize = Math.min(100, Math.max(1, parseInt(limit, 10)));

    const startIndex = (pageNumber - 1) * pageSize;

    // Build filter object
    const filter = {
      ...(invoiceType && { invoiceType }),
      ...(searchTerm && { invoiceId: { $regex: searchTerm, $options: "i" } }),
      ...(createdBy && { createdBy }),
    };

    const [totalInvoicesCount, invoices] = await Promise.all([
      Invoice.countDocuments(filter),
      Invoice.find(filter)
        .sort({ createdAt: -1 })
        .limit(pageSize)
        .skip(startIndex),
    ]);

    const data = {
      invoiceData: invoices,
      currentPage: pageNumber,
      hasNextPage: startIndex + pageSize < totalInvoicesCount,
      hasPreviousPage: pageNumber > 1,
      nextPage:
        startIndex + pageSize < totalInvoicesCount ? pageNumber + 1 : null,
      previousPage: pageNumber > 1 ? pageNumber - 1 : null,
      totalPagesCount: Math.ceil(totalInvoicesCount / pageSize),
      totalInvoicesCount,
    };

    res.status(200).json({
      message: "Invoices fetched successfully",
      data,
    });
  } catch (err) {
    console.error("Error fetching invoices:", err);
    res.status(500).json({
      message: "Something went wrong while fetching invoices",
      error: err.message,
    });
  }
};

exports.invoiceApproval = async (req, res) => {
  const { invoiceId, approvalStatus, message } = req.query;

  try {
    // Validate required parameters
    if (!invoiceId || !approvalStatus) {
      return res.status(400).json({ message: "Missing required parameters" });
    }

    // Find and update the invoice
    const updateData = { invoicestatus: approvalStatus };
    if (approvalStatus === "rejected") {
      updateData.rejectionReason = message || "Rejected";
    }

    const invoiceData = await Invoice.findOneAndUpdate(
      { _id: invoiceId }, // Query to find the invoice
      { $set: updateData }, // Update data
      { new: true } // Return the updated documen
    );

    if (!invoiceData) {
      return res.status(404).json({ message: "Invoice not found" });
    }

    // Trigger the appropriate action based on the status
    if (approvalStatus === "approved") {
      await invoiceApproved(invoiceData.invoiceId);
    } else if (approvalStatus === "rejected") {
      await invoiceRejected(invoiceData.invoiceId, message);
    }

    // Respond with the updated invoice
    res.status(200).json({
      message: `Invoice ${approvalStatus} successfully`,
      invoice: invoiceData,
    });
  } catch (error) {
    console.error("Error updating invoice status:", error);
    res.status(500).json({
      message: "Something went wrong",
      error: error.message,
    });
  }
};

exports.invoiceById = async (req, res) => {
  const { invoiceId } = req.query;

  try {
    const invoice = await Invoice.findOne({ _id: invoiceId });

    if (!invoice) {
      return res.status(404).json({ message: "Invoice not found" });
    }

    return res
      .status(200)
      .json({ message: "Invoice fetched successfully", invoice });
  } catch (error) {
    res.status(500).json({ message: "Something went wrong", error });
    console.log(error);
  }
};

exports.invoiceResubmit = async (req, res) => {
  const { invoiceId } = req.query;

  try {
    const invoice = await Invoice.findOne({ _id: invoiceId });

    if (!invoice) {
      return res.status(404).json({ message: "Invoice not found" });
    }
    invoice.invoicestatus = "yetToApproved";
    await invoice.save();

    return res
      .status(200)
      .json({ message: "Invoice fetched successfully", invoice });
  } catch (error) {
    res.status(500).json({ message: "Something went wrong", error });
    console.log(error);
  }
};
