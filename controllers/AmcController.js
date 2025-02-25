const { AgentPolicyRejectedEmail } = require("../helper/emailFunction");
const { AMCs } = require("../model/AmcModel");
const Invoice = require("../model/InvoiceModel");
const User = require("../model/User");
const fs = require("fs");
const path = require("path");
const { parse: json2csv } = require("json2csv");
const { formatNumber } = require("../helper/countreunvtion");

exports.AmcFormData = async (req, res) => {
  try {
    const amcData = req.body;
    const vinNumber = amcData.vehicleDetails.vinNumber;
    const email = amcData.customerDetails.email;
    const duplicateVinNumber = await AMCs.findOne({ vinNumber });
    if (duplicateVinNumber) {
      return res.status(400).json({
        message: "Vehicle vin number already exists",
      });
    }

    const duplicateEmail = await AMCs.findOne({ email });
    if (duplicateEmail) {
      return res.status(400).json({
        message: "Email already exists",
      });
    }

    const currentYear = new Date().getFullYear();
    const last5DigitsOfVin = vinNumber.slice(-5);
    const customId = `Raam-AMC-${currentYear}-${last5DigitsOfVin}`;

    const newAmc = new AMCs({
      ...amcData,
      customId,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    await newAmc.save();

    return res.status(201).json({
      message: "AMC saved successfully.",
      AMC: newAmc,
    });
  } catch (error) {
    console.error("Error saving AMC data:", error);
    return res.status(500).json({
      message: "Failed to save AMC data",
      error: error.message,
    });
  }
};

exports.editAmc = async (req, res) => {
  try {
    const { id } = req.params;
    const updatedData = req.body;

    // Check for duplicates
    if (updatedData.vinNumber) {
      const duplicateVinNumber = await AMCs.findOne({
        vinNumber: updatedData.vinNumber,
        _id: { $ne: id }, // Exclude the current being updated
      });
      if (duplicateVinNumber) {
        return res
          .status(400)
          .json({ message: "Vehicle Vin Number already exists" });
      }
    }

    if (updatedData.email) {
      const duplicateEmail = await AMCs.findOne({
        email: updatedData.email,
        _id: { $ne: id }, // Exclude the current AMC being updated
      });
      if (duplicateEmail) {
        return res.status(400).json({ message: "Email already exists" });
      }
    }

    const updateVinNumber = await AMCs.findByIdAndUpdate(id, updatedData, {
      new: true,
      runValidators: true,
    });

    if (!updateVinNumber) {
      return res.status(404).json({ message: "AMC not found" });
    }

    res
      .status(200)
      .json({ message: "AMC updated successfully", data: updateVinNumber });
  } catch (err) {
    console.error("Error updating AMC data:", err);
    res.status(500).json({ message: "Something went wrong", error: err });
  }
};

exports.updateAMCStatus = async (req, res) => {
  try {
    const { id, type } = req.body;
    const { reason } = req.query;
    const validTypes = [
      "pending",
      "approved",
      "rejected",
      "approvedReq",
      "reqCancel",
    ];

    // Validate policy type
    if (!validTypes.includes(type)) {
      return res.status(400).json({ message: "Invalid policy type." });
    }

    const InvoiceCheck = await Invoice.findOne({ serviceId: id });

    if (InvoiceCheck && !type) {
      return res
        .status(400)
        .json({ message: "Invoice already exist for this AMC" });
    }

    // Find the policy by ID
    const AMCdata = await AMCs.findById(id);
    if (!AMCdata) {
      return res.status(404).json({ message: "AMC not found." });
    }

    const agent = await User.findById(AMCdata.createdBy);

    if (type === "approvedReq" && AMCdata.isCancelReq === "reqCancel") {
      AMCdata.isCancelReq = "approvedReq";
      await AMCdata.save();

      return res.status(200).json({
        message: "Cancellation request approved.",
        isCancelReq: AMCdata.isCancelReq,
        status: 200,
      });
    }
    if (type === "reqCancel") {
      AMCdata.isCancelReq = "reqCancel";
      await AMCdata.save();

      return res.status(200).json({
        message: "Requested for cancellation",
        isCancelReq: AMCdata.isCancelReq,
        status: 200,
      });
    }

    // Handle rejection case
    if (type === "rejected") {
      if (!reason) {
        return res
          .status(400)
          .json({ message: "Rejection reason is required." });
      }

      const deletionDate = new Date();
      deletionDate.setDate(deletionDate.getDate() + 3);

      AMCdata.rejectionReason = reason;
      AMCdata.rejectedAt = deletionDate;
      AMCdata.amcStatus = "rejected";

      await AMCdata.save();
      console.log(
        `AMCdata with ID: ${id} scheduled for deletion with reason: ${reason}.`
      );

      await AgentPolicyRejectedEmail(
        agent.email,
        agent.agentName,
        reason,
        "AMC(Annual Maintenance Contract)",
        AMCdata.vehicleDetails.vinNumber,
        AMCdata.customId,
        "AMC",
        "Raam4Wheelers LLP"
      );

      return res.status(200).json({ message: "AMC rejected", AMCdata });
    }

    // Handle approval case
    if (type === "approved") {
      AMCdata.amcStatus = "approved";
      AMCdata.approvedAt = new Date();

      AMCdata.amcStatus = "approved";
      AMCdata.approvedAt = new Date();

      await AMCdata.save();

      return res
        .status(200)
        .json({ message: "AMC approved", AMCdata, status: 200 });
    }

    AMCdata.amcStatus = "pending";

    await AMCdata.save();

    return res
      .status(200)
      .json({ message: "AMC Status Changed Successfully.", AMCdata });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Internal Server Error" });
  }
};

exports.disableAmc = async (req, res) => {
  try {
    const { amcId } = req.query;

    const AMCdata = await AMCs.findById(amcId);
    if (!AMCdata) {
      return res.status(404).json({ message: "AMC not found" });
    }

    if (!AMCdata.approvedAt) {
      return res.status(403).json({
        message: "AMC data must be approved before it can be cancel",
      });
    }

    const approvedDate = new Date(AMCdata.approvedAt);
    const currentDate = new Date();
    const diffInDays = Math.floor(
      (currentDate - approvedDate) / (1000 * 60 * 60 * 24)
    );

    if (diffInDays > 15) {
      return res.status(403).json({
        message: "AMC data cannot be disabled after 15 days of creation",
      });
    }

    AMCdata.isDisabled = true;
    const oneMonthFromApproval = new Date(approvedDate);
    oneMonthFromApproval.setMonth(approvedDate.getMonth() + 1);
    AMCdata.disabledAt = oneMonthFromApproval;

    await AMCdata.save();

    res
      .status(200)
      .json({ message: "AMC disabled successfully", data: AMCdata });
  } catch (err) {
    console.error("Error disabling AMC:", err);
    res.status(500).json({ message: "Something went wrong", error: err });
  }
};

exports.amcDataById = async (req, res) => {
  const { id, status } = req.query;
  try {
    if (!id && !status) {
      return res.status(400).json({
        message: "Please provide either AMCID or status",
      });
    }

    // Build the query dynamically based on available parameters
    const query = {};
    if (id) query._id = id;
    if (status) query.status = status;

    const data = await AMCs.findOne(query);

    if (!data) {
      return res.status(404).json({
        message: "No data found with the provided criteria",
      });
    }

    return res.status(200).json({
      message: "Data fetched successfully",
      data: data,
    });
  } catch (error) {
    console.error("Error fetching AMC data:", error);
    return res.status(500).json({
      message: "Something went wrong",
      error: error.message,
    });
  }
};

exports.getAllAmcList = async (req, res) => {
  const { page = 1, limit = 10, search = "", id, status } = req.query;
   const {roleType, location} = req.user
  try {
    // Construct query
    const query = {};
    const orConditions = [];

    if (id) {
      orConditions.push({ createdBy: id });
    }

    // Handle status
    if (status !== undefined) {
      const isBooleanStatus = status === "true" || status === "false";
      if (isBooleanStatus) {
        orConditions.push({ isDisabled: status === "true" });
      } else if (typeof status === "string") {
        orConditions.push({
          $or: [{ amcStatus: status }, { isCancelReq: status }],
        });
      }
    }

    if (orConditions.length > 0) {
      query.$or = orConditions;
    }

    if (search) {
      query["vehicleDetails.vinNumber"] = { $regex: search, $options: "i" };
    }
    if (roleType === "1" && location) {
      query["vehicleDetails.dealerLocation"] = location;
    }
    
    // Pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Fetch data
    const data = await AMCs.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));
    const totalCount = await AMCs.countDocuments(query);

    if (!data || data.length === 0) {
      return res.status(404).json({ message: "No AMC Available" });
    }

    return res.status(200).json({
      message: "Data fetched successfully",
      data,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(totalCount / limit),
        totalItems: totalCount,
      },
    });
  } catch (error) {
    console.error("Error fetching AMC data:", error);
    return res.status(500).json({
      message: "Something went wrong",
      error: error.message,
    });
  }
};

exports.AMCResubmit = async (req, res) => {
  const { amcId } = req.query;

  try {
    const AMCData = await AMCs.findOne({ _id: amcId });

    if (!AMCData) {
      return res.status(404).json({ message: "AMC not found" });
    }
    AMCData.amcStatus = "pending";
    await AMCData.save();

    return res
      .status(200)
      .json({ message: "AMC fetched successfully", AMCData });
  } catch (error) {
    res.status(500).json({ message: "Something went wrong", error });
    console.log(error);
  }
};

exports.addExpenseData = async (req, res) => {
  try {
    const { serviceData } = req.body; 

    if (!Array.isArray(serviceData) || serviceData.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Invalid data. Please Upload Valid Data.",
      });
    }

    const vinNumbers = serviceData.map((entry) => entry.serviceVinNumber);

    const amcRecords = await AMCs.find({
      "vehicleDetails.vinNumber": { $in: vinNumbers },
    });

    if (amcRecords.length === 0) {
      return res.status(404).json({
        success: false,
        message: "AMC records not found for the provided VIN numbers.",
      });
    }

    const serviceDataMap = new Map(
      serviceData.map((entry) => [
        entry.serviceVinNumber,
        entry.expenses.map((expense) => ({
          ...expense,
          serviceTotalAmount:
            (parseFloat(expense.partsPrice) || 0) +
            (parseFloat(expense.labourPrice) || 0) +
            (parseFloat(expense.vasPrice) || 0),
        })),
      ])
    );

    const updates = amcRecords
      .map((amcRecord) => {
        const vinNumber = amcRecord.vehicleDetails.vinNumber;
        const expenses = serviceDataMap.get(vinNumber) || [];

        // Filter new services (avoiding duplicates)
        const newServices = expenses.filter(
          (service) =>
            !amcRecord.amcExpense.some(
              (expense) => expense.serviceDate === service.serviceDate
            )
        );

        if (newServices.length === 0) return null;

        const currentAgreementPeriod =
          Number(amcRecord.vehicleDetails.agreementPeriod) || 0;
        const updatedAgreementPeriod = Math.max(
          currentAgreementPeriod - newServices.length,
          0
        );

        return {
          updateOne: {
            filter: { _id: amcRecord._id },
            update: {
              $push: { amcExpense: { $each: newServices } },
              $set: {
                "vehicleDetails.agreementPeriod": String(updatedAgreementPeriod),
              },
            },
          },
        };
      })
      .filter(Boolean);

    if (updates.length === 0) {
      return res.status(400).json({
        success: false,
        message: "No new service entries to update.",
      });
    }

    await AMCs.bulkWrite(updates);

    return res.status(200).json({
      success: true,
      message: "Service expenses added and agreement periods updated successfully.",
    });
  } catch (error) {
    console.error("Error adding service expenses:", error);
    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
    });
  }
};


exports.getamcStats = async (req, res) => {
  try {
    const { location, vehicleModel, startDate, endDate } = req.query;

    let filter = {};
    if (location) {
      filter["vehicleDetails.dealerLocation"] = location;
    }
    if (vehicleModel) {
      filter["vehicleDetails.model"] = vehicleModel;
    }
    if (startDate || endDate) {
      if (startDate && endDate) {
        // If both startDate and endDate are provided, filter between them
        filter["createdAt"] = {
          $gte: new Date(`${startDate}T00:00:00.000Z`),
          $lte: new Date(`${endDate}T23:59:59.999Z`),
        };
      } else if (startDate) {
        // If only startDate is provided, match only that date
        filter["createdAt"] = {
          $gte: new Date(`${startDate}T00:00:00.000Z`),
          $lte: new Date(`${startDate}T23:59:59.999Z`),
        };
      } else if (endDate) {
        // If only endDate is provided, match only that date
        filter["createdAt"] = {
          $gte: new Date(`${endDate}T00:00:00.000Z`),
          $lte: new Date(`${endDate}T23:59:59.999Z`),
        };
      }
    }
    
    const amcDocs = await AMCs.find(filter);
    const totalamcCount = amcDocs.length;
    const totalRevenue = amcDocs.reduce((sum, doc) => {
      return sum + Number(doc.vehicleDetails?.total || 0);
    }, 0);

    const totalExpense = amcDocs.reduce((sum, doc) => {
      return (
        sum +
        (doc.amcExpense?.reduce((acc, item) => acc + Number(item.serviceTotalAmount || 0), 0) || 0)
      );
    }, 0);
    

    return res.status(200).json({
      success: true,
      totalamcCount: formatNumber(totalamcCount),
      totalRevenue: formatNumber(totalRevenue),
      totalExpense: formatNumber(totalExpense),
    });
  } catch (error) {
    console.error("Error fetching amc stats:", error);
    return res
      .status(500)
      .json({ success: false, message: "Internal Server Error" });
  }
};

exports.downloadAmcCsv = async (req, res) => {
  try {
    let query = {
      $and: [{ isDisabled: { $ne: true } }],
    };

    const data = await AMCs.find(query);

    const csvData = data.map((policy) => ({
      "Customer Name": policy.customerDetails.customerName || "",
      Email: policy.customerDetails.email || "",
      "Pan Number": policy.customerDetails.pan || "",
      Address: policy.customerDetails.address || "",
      "Contact Number": policy.customerDetails.contact || "",
      "Gst Number": policy.customerDetails.customerGst || "",
      "Vehicle Model": policy.vehicleDetails.model || "",
      "Vin Number": policy.vehicleDetails.vinNumber || "",
      "Fuel Type": policy.vehicleDetails.fuelType || "",
      "Agreement Period": policy.vehicleDetails.agreementPeriod || "",
      "Agreement Start Date": policy.vehicleDetails.agreementStartDate || "",
      "Agreement Valid Date": policy.vehicleDetails.agreementValidDate || "",
      "Agreement Start Milage":
        policy.vehicleDetails.agreementStartMilage || "",
      "Agreement Valid Milage":
        policy.vehicleDetails.agreementValidMilage || "",
      "Maximum Valid PMS": policy.vehicleDetails.MaximumValidPMS || "",
      "Dealer Location": policy.vehicleDetails.dealerLocation || "",
      "Total Price": policy.vehicleDetails.total || "",
      "Regional Manager Name": policy.vehicleDetails.rmName || "",
      "RM Employee Id": policy.vehicleDetails.rmEmployeeId || "",
      "RM Email": policy.vehicleDetails.rmEmail || "",
      "GM Email": policy.vehicleDetails.gmEmail || "",

      "Current Status": policy.amcStatus || "",
    }));

    const csvDataString = json2csv(csvData, {
      fields: [
        "Customer Name",
        "Email",
        "Pan Number",
        "Address",
        "Contact Number",
        "Gst Number",
        "Vehicle Model",
        "Vin Number",
        "Fuel Type",
        "Agreement Period",
        "Agreement Start Date",
        "Agreement Valid Date",
        "Agreement Start Milage",
        "Agreement Valid Milage",
        "Maximum Valid PMS",
        "Dealer Location",
        "Total Price",
        "Regional Manager Name",
        "RM Employee Id",
        "RM Email",
        "GM Email",
        "Current Status",
      ],
    });

    const folderPath = path.join(__dirname, "..", "csv");
    const filePath = path.join(folderPath, "exportedData.csv");

    if (!fs.existsSync(folderPath)) {
      fs.mkdirSync(folderPath);
    }

    fs.writeFileSync(filePath, csvDataString);

    res.download(filePath, "amcData.csv", (err) => {
      if (err) {
        console.error("Error sending file:", err);
        res.status(500).send("Internal Server Error");
      } else {
        fs.unlink(filePath, (unlinkErr) => {
          if (unlinkErr) {
            console.error("Error deleting file:", unlinkErr);
          }
        });
      }
    });
  } catch (error) {
    console.error("Error downloading CSV:", error);
    res.status(500).send("Internal Server Error");
  }
};
