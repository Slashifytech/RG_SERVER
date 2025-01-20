const { invoiceApproved, invoiceRejected } = require("../helper/emailFunction");
const Invoice = require("../model/InvoiceModel");
const InvoiceCounter = require("../model/InvoiceCounterModel");


exports.addInvoice = async (req, res) => {
  const { invoiceType, ...payload } = req.body;
  const vinNumber = req.body.vehicleDetails.vinNumber;

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
      ...payload,
    });

    await newInvoice.save();

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

  try {
    if (!id) {
      console.error("Invoice ID is missing in the query.");
      return res.status(400).json({ message: "Invoice ID is required" });
    }

    console.log("Invoice ID:", id);

    const existingInvoice = await Invoice.findById(id);
    if (!existingInvoice) {
      console.error("Invoice not found for ID:", id);
      return res.status(404).json({ message: "Invoice not found" });
    }

    console.log("Existing Invoice:", existingInvoice);

    const vinNumber = payload?.vehicleDetails?.vinNumber;
    if (vinNumber && vinNumber !== existingInvoice.vehicleDetails?.vinNumber) {
      const vinNumberExists = await Invoice.findOne({
        "vehicleDetails.vinNumber": vinNumber,
      });
      console.log("VIN Number Check:", vinNumberExists);

      if (vinNumberExists) {
        return res
          .status(400)
          .json({ message: "VIN number is already in use" });
      }
    }

    // Update the existing invoice with the new payload
    Object.assign(existingInvoice, payload);

    try {
      await existingInvoice.save();
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
