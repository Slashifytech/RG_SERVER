const { invoiceApproved, invoiceRejected } = require("../helper/emailFunction");
const Invoice = require("../model/InvoiceModel");
const InvoiceCounter = require("../model/InvoiceCounterModel");

exports.addInvoice = async (req, res) => {
  const {role, email, ...payload } = req.body;

  try {
    const existingEmail = await Invoice.findOne({ email });
    if (existingEmail) {
      return res.status(400).json({ message: "Email already exists" });
    }
   let invoiceStatus
    if(role === "1"){
       invoiceStatus = "approved"
    }
    // Generate a unique invoiceId using Counter collection
    const counter = await InvoiceCounter.findOneAndUpdate(
      { name: "invoiceId" },
      { $inc: { count: 1 } },
      { new: true, upsert: true }
    );

    const prefix = "WS-360";
    const paddedCount = String(counter.count).padStart(3, "0");
    const invoiceId = `${prefix}-${paddedCount}`;

    const newInvoice = new Invoice({
      email,
      invoiceId,
      invoiceStatus,
      ...payload,
    });

    await newInvoice.save();

    res
      .status(201)
      .json({ message: "Invoice added successfully", data: newInvoice });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Something went wrong" });
  }
};

exports.editInvoice = async (req, res) => {
  const { id } = req.query;
  const { email, ...payload } = req.body;

  try {
    const existingInvoice = await Invoice.findById(id);
    if (!existingInvoice) {
      res.status(404).json({ message: "Invoice not found" });
      return;
    }
    // Check if the new email is already in use by another invoice
    if (email && email !== existingInvoice.email) {
      const emailExists = await Invoice.findOne({ email });
      if (emailExists) {
        res.status(400).json({ message: "Email is already in use" });
        return;
      }
    }

    existingInvoice.email = email || existingInvoice.email;
    Object.assign(existingInvoice, payload);

    await existingInvoice.save();

    res
      .status(200)
      .json({ message: "Invoice updated successfully", data: existingInvoice });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Something went wrong" });
  }
};

exports.getAllInvoice = async (req, res) => {
  const { page = 1, limit = 10 } = req.query;

  const query = {
    $or: [{ invoicestatus: "yetToApproved" }, { isCancelReq: "reqCancel" }],
  };

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
  const { page = 1, limit = 10, invoiceStatus, searchTerm, createdBy } = req.query;

  try {
    const pageNumber = Math.max(1, parseInt(page, 10));
    const pageSize = Math.min(100, Math.max(1, parseInt(limit, 10)));

    const startIndex = (pageNumber - 1) * pageSize;

    // Build filter object
    const filter = {
      ...(invoiceStatus && { invoiceStatus }),
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
      { new: true } // Return the updated document
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
    invoice.invoicestatus = "yetToApproved"
    await invoice.save();
      
    return res
      .status(200)
      .json({ message: "Invoice fetched successfully", invoice });
  } catch (error) {
    res.status(500).json({ message: "Something went wrong", error });
    console.log(error);
  }
};


