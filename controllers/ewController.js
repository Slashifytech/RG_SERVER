const {

  AgentPolicyRejectedEmail,
} = require("../helper/emailFunction");
const EwPolicy = require("../model/EwModel");
const User = require("../model/User");
const fs = require("fs");
const path = require("path");
const { parse: json2csv } = require("json2csv");
const { formatNumber } = require("../helper/countreunvtion");
exports.ewPolicyFormData = async (req, res) => {
  try {
    const ewPolicy = req.body;
    const vinNumber = ewPolicy.vehicleDetails.vinNumber;
    const email = ewPolicy.customerDetails.email;
    const duplicateVinNumber = await EwPolicy.findOne({ vinNumber });
    if (duplicateVinNumber) {
      return res.status(400).json({
        message: "Vehicle vin number already exists",
      });
    }

    const duplicateEmail = await EwPolicy.findOne({ email });
    if (duplicateEmail) {
      return res.status(400).json({
        message: "Email already exists",
      });
    }

    const currentYear = new Date().getFullYear();
    const last5DigitsOfVin = vinNumber.slice(-5);
    const customId = `360-EW-${currentYear}-${last5DigitsOfVin}`;

    const newEwPolicy = new EwPolicy({
      ...ewPolicy,
      customId,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    await newEwPolicy.save();

    return res.status(201).json({
      message: "ewPolicy saved successfully.",
      ewPolicy: newEwPolicy,
    });
  } catch (error) {
    console.error("Error saving ewPolicy data:", error);
    return res.status(500).json({
      message: "Failed to save ewPolicy data",
      error: error.message,
    });
  }
};

exports.editEwPolicy = async (req, res) => {
  try {
    const { id } = req.params;
    const updatedData = req.body;

    // Check for duplicates
    if (updatedData.vinNumber) {
      const duplicateVinNumber = await EwPolicy.findOne({
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
      const duplicateEmail = await EwPolicy.findOne({
        email: updatedData.email,
        _id: { $ne: id }, // Exclude the current ewPolicy being updated
      });
      if (duplicateEmail) {
        return res.status(400).json({ message: "Email already exists" });
      }
    }

    const updateVinNumber = await EwPolicy.findByIdAndUpdate(id, updatedData, {
      new: true,
      runValidators: true,
    });

    if (!updateVinNumber) {
      return res.status(404).json({ message: "EwPolicy not found" });
    }

    res.status(200).json({
      message: "EwPolicy updated successfully",
      data: updateVinNumber,
    });
  } catch (err) {
    console.error("Error updating EwPolicy data:", err);
    res.status(500).json({ message: "Something went wrong", error: err });
  }
};

exports.updateEwStatus = async (req, res) => {
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

    // Find the policy by ID
    const ewPolicydata = await EwPolicy.findById(id);

    if (!ewPolicydata) {
      return res.status(404).json({ message: "Ew Policy not found." });
    }
    const agent = await User.findById(ewPolicydata.createdBy);
    if (type === "approvedReq" && ewPolicydata.isCancelReq === "reqCancel") {
      ewPolicydata.isCancelReq = "approvedReq";
      await ewPolicydata.save();

      return res.status(200).json({
        message: "Cancellation request approved.",
        isCancelReq: ewPolicydata.isCancelReq,
      });
    }
    if (type === "reqCancel") {
      ewPolicydata.isCancelReq = "reqCancel";
      await ewPolicydata.save();

      return res.status(200).json({
        message: "Requested for cancellation",
        isCancelReq: ewPolicydata.isCancelReq,
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

      ewPolicydata.rejectionReason = reason;
      ewPolicydata.rejectedAt = deletionDate;
      ewPolicydata.ewStatus = "rejected";

      await ewPolicydata.save();
      console.log(
        `EW Policy with ID: ${id} scheduled for deletion with reason: ${reason}.`
      );

      await AgentPolicyRejectedEmail(
        agent.email,
        agent.agentName,
        reason,
        "ewPolicy",
        ewPolicydata.vehicleDetails.vinNumber,
        ewPolicydata.customId,
        "ewPolicy",
        "360 CAR PROTECT INDIA LLP"
      );

      return res
        .status(200)
        .json({ message: "ewPolicy rejected", ewPolicydata, status: 200 });
    }

    // Handle approval case
    if (type === "approved") {
      ewPolicydata.ewStatus = "approved";
      ewPolicydata.approvedAt = new Date();

      ewPolicydata.ewStatus = "approved";
      ewPolicydata.approvedAt = new Date();

      await ewPolicydata.save();
      return res
        .status(200)
        .json({ message: "ewPolicydata approved", ewPolicydata, status: 200 });
    }

    ewPolicydata.ewStatus = "pending";

    await ewPolicydata.save();

    return res.status(200).json({
      message: "Ew Policy Data Status Changed Successfully.",
      ewPolicydata,
      status: 200,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Internal Server Error" });
  }
};

exports.disableEwPolicy = async (req, res) => {
  try {
    const { ewId } = req.query;

    const ewPolicydata = await EwPolicy.findById(ewId);
    if (!ewPolicydata) {
      return res.status(404).json({ message: "ewPolicy not found" });
    }

    if (!ewPolicydata.approvedAt) {
      return res.status(403).json({
        message: "Ew Policy must be approved before it can be disabled",
      });
    }

    const approvedDate = new Date(ewPolicydata.approvedAt);
    const currentDate = new Date();
    const diffInDays = Math.floor(
      (currentDate - approvedDate) / (1000 * 60 * 60 * 24)
    );

    if (diffInDays > 15) {
      return res.status(403).json({
        message: "ewPolicydata cannot be disabled after 15 days of creation",
      });
    }

    ewPolicydata.isDisabled = true;
    const oneMonthFromApproval = new Date(approvedDate);
    oneMonthFromApproval.setMonth(approvedDate.getMonth() + 1);
    ewPolicydata.disabledAt = oneMonthFromApproval;

    await ewPolicydata.save();

    res
      .status(200)
      .json({ message: "Ew Policy disabled successfully", data: ewPolicydata });
  } catch (err) {
    console.error("Error disabling Ew Policy:", err);
    res.status(500).json({ message: "Something went wrong", error: err });
  }
};

exports.ewById = async (req, res) => {
  const { id, status } = req.query;
  try {
    if (!id && !status) {
      return res.status(400).json({
        message: "Please provide either ewId or status",
      });
    }

    const query = {};
    if (id) query._id = id;
    if (status) query.status = status;

    const data = await EwPolicy.findOne(query);
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
    console.error("Error fetching ewPolicy data:", error);
    return res.status(500).json({
      message: "Something went wrong",
      error: error.message,
    });
  }
};

exports.getAllEwLists = async (req, res) => {
  const { page = 1, limit = 10, search = "", id, status } = req.query;
  const {roleType, location} = req.user
  try {
    const query = {};
    const orConditions = [];

    if (id) {
      orConditions.push({ createdBy: id });
    }

    if (status !== undefined) {
      const isBooleanStatus = status === "true" || status === "false";
      if (isBooleanStatus) {
        orConditions.push({ isDisabled: status === "true" });
      } else if (typeof status === "string") {
        orConditions.push({
          $or: [{ ewStatus: status }, { isCancelReq: status }],
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

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const data = await EwPolicy.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));
    const totalCount = await EwPolicy.countDocuments(query);

    if (!data || data.length === 0) {
      return res.status(404).json({ message: "No Ew Policy Available" });
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
    console.error("Error fetching ewPolicy data:", error.message);
    return res.status(500).json({
      message: "Something went wrong",
      error: error.message,
    });
  }
};

exports.EwResubmit = async (req, res) => {
  const { ewId } = req.query;

  try {
    const ewPolicydata = await EwPolicy.findById({ _id: ewId });
    if (!ewPolicydata) {
      return res.status(404).json({ message: "Ew Policy not found" });
    }
    ewPolicydata.ewStatus = "pending";
    await ewPolicydata.save();

    return res
      .status(200)
      .json({ message: "Ew Policy fetched successfully", ewPolicydata });
  } catch (error) {
    res.status(500).json({ message: "Something went wrong", error });
    console.log(error);
  }
};

exports.downloadEwCsv = async (req, res) => {
  try {
    let query = {
      $and: [{ isDisabled: { $ne: true } }],
    };

    const data = await EwPolicy.find(query);

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
      "Delivery Date": policy.vehicleDetails.deliveryDate || "",
      "Sale Date": policy.vehicleDetails.saleDate || "",
      "Present Kilo Meter": policy.vehicleDetails.presentKm || "",
      "Warranty Limit": policy.vehicleDetails.warrantyLimit || "",
      "Engine Number": policy.vehicleDetails.engineNumber || "",
      "Dealer Location": policy.vehicleDetails.dealerLocation || "",
      "Policy Date": policy.ewDetails.policyDate || "",
      "Warranty Amount": policy.ewDetails.warrantyAmount || "",
      "Plan Type": policy.ewDetails.planType || "",
      "PlanSub Type": policy.ewDetails.planSubType || "",
      "Registration Type": policy.ewDetails.registrationType || "",
      "Warranty Coverage Period": policy.ewDetails.warrantyCoveragePeriod || "",
      "Start KM": policy.ewDetails.startKm || "",
      "End KM": policy.ewDetails.endKm || "",
      "EW Status": policy.ewDetails.ewStatus || "",
      "Plan Type": policy.ewDetails.planType || "",
      "Policy Number": policy.ewDetails.policyNumber || "",
      "Regional Manager Name": policy.vehicleDetails.rmName || "",
      "RM Employee Id": policy.vehicleDetails.rmEmployeeId || "",
      "RM Email": policy.vehicleDetails.rmEmail || "",
      "GM Email": policy.vehicleDetails.gmEmail || "",

      "Current Status": policy.ewStatus || "",
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
        "Validity Milage",
        "Delivery Date",
        "Dealer Location",
        "Policy Date",
        "Warranty Amount",
        "Plan Type",
        "PlanSub Type",
        "Registration Type",
        "Warranty Coverage Period",
        "Start KM",
        "End KM",
        "EW Status",
        "Plan Type",
        "Policy Number",
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
exports.getEwStats = async (req, res) => {
  try {
    const { location, vehicleModel, startDate, endDate } = req.query;

    let filter = {};
    if (location) {
      filter["vehicleDetails.dealerLocation"] = location;
    }
    if (vehicleModel) {
      filter["vehicleDetails.vehicleModel"] = vehicleModel;
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
    

    const EwDocs = await EwPolicy.find(filter);
    const totalEwCount = EwDocs.length;
    const totalRevenue = EwDocs.reduce((sum, doc) => {
      return sum + Number(doc.ewDetails?.warrantyAmount || 0);
    }, 0);



    return res.status(200).json({
      success: true,
      totalEwCount :formatNumber(totalEwCount),
      totalRevenue : formatNumber(totalRevenue),
    });
  } catch (error) {
    console.error("Error fetching buyback stats:", error);
    return res
      .status(500)
      .json({ success: false, message: "Internal Server Error" });
  }
};