const mongoose = require("mongoose");
const { mbData, mgData } = require("../model/masterData");

const Policy = require("../model/Policies");
const User = require("../model/User");
const fs = require("fs");
const path = require("path");
const { parse: json2csv } = require("json2csv");
const {
  sendAgentRejected,
  sendAgentAccepted,
  sendCustomerAccepted,
  agentCancelledPolicy,
} = require("../helper/emailFunction");
const { getNextPolicyId } = require("../helper/countreunvtion");
const Teams = require("../model/TeamsModel");

exports.policyFormData = async (req, res) => {
  try {
    const policyData = req.body;
    const { vehicleEngineNumber, vehicleRegNumber, email } = policyData;

    const duplicateVehicleEngineNumber = await Policy.findOne({ vehicleEngineNumber });
    if (duplicateVehicleEngineNumber) {
      return res.status(400).json({
        message: "Vehicle registration number already exists",
      });
    }
    
    
    const duplicateRegNumber = await Policy.findOne({ vehicleRegNumber });
    if (duplicateRegNumber) {
      return res.status(400).json({
        message: "Vehicle registration number already exists",
      });
    }
    
    const duplicateEmail = await Policy.findOne({ email });
    if (duplicateEmail) {
      return res.status(400).json({
        message: "Email already exists",
      });
    }

    // Save the policy data
    const newPolicy = new Policy({
      ...policyData,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    await newPolicy.save();

    return res.status(201).json({
      message: "Policy saved successfully.",
      policy: newPolicy,
    });
  } catch (error) {
    console.error("Error saving policy data:", error);
    return res.status(500).json({
      message: "Failed to save policy data",
      error: error.message,
    });
  }
};


exports.editPolicy = async (req, res) => {
  try {
    const { id } = req.params;
    const updatedData = req.body;

    // Check for duplicates
    if (updatedData.vehicleEngineNumber) {
      const duplicateEngineNumber = await Policy.findOne({
        vehicleEngineNumber: updatedData.vehicleEngineNumber,
        _id: { $ne: id }, // Exclude the current policy being updated
      });
      if (duplicateEngineNumber) {
        return res.status(400).json({ message: "Vehicle engine number already exists" });
      }
    }

    if (updatedData.vehicleRegNumber) {
      const duplicateRegNumber = await Policy.findOne({
        vehicleRegNumber: updatedData.vehicleRegNumber,
        _id: { $ne: id }, // Exclude the current policy being updated
      });
      if (duplicateRegNumber) {
        return res.status(400).json({ message: "Vehicle registration number already exists" });
      }
    }

    if (updatedData.email) {
      const duplicateEmail = await Policy.findOne({
        email: updatedData.email,
        _id: { $ne: id }, // Exclude the current policy being updated
      });
      if (duplicateEmail) {
        return res.status(400).json({ message: "Email already exists" });
      }
    }

    // Update the policy
    const updatedPolicy = await Policy.findByIdAndUpdate(id, updatedData, {
      new: true,
      runValidators: true,
    });

    if (!updatedPolicy) {
      return res.status(404).json({ message: "Policy not found" });
    }

    res.status(200).json({ message: "Policy updated successfully", data: updatedPolicy });
  } catch (err) {
    console.error("Error updating policy data:", err);
    res.status(500).json({ message: "Something went wrong", error: err });
  }
};



exports.deletePolicy = async (req, res) => {
  try {
    const { id } = req.params;

    const deleteData = await Policy.findByIdAndDelete(id);
    if (!deleteData) {
      return res.status(404).json({ message: "Policy not found" });
    }
    res.status(200).json({ message: "Policy deleted successfully" });
  } catch (err) {
    console.error("Error updating agent data:", err);
    res.status(500).json({ message: "Something went wrong", error: err });
  }
};

exports.getAllPolicy = async (req, res) => {
  try {
    const { page, limit, manufacturer, search } = req.query;
    const pageNumber = parseInt(page);
    const pageSize = parseInt(limit);
    const startIndex = (pageNumber - 1) * pageSize;
    const endIndex = pageNumber * pageSize;

    const query = {
      isDisabled: { $ne: true },
      policyStatus: "approved",
    };

    if (manufacturer) {
      query.vehicleManufacturer = manufacturer;
    }

    if (search) {
      query.$or = [
        { policyId: { $regex: search, $options: 'i' } }, // Case-insensitive search
        { vehicleEngineNumber: { $regex: search, $options: 'i' } },
        { vehicleRegNumber: { $regex: search, $options: 'i' } },
      ];
    }

    const totalPoliciesCount = await Policy.countDocuments(query);

    const policies = await Policy.find(query)
      .sort({ createdAt: -1 })
      .limit(pageSize)
      .skip(startIndex);

    const result = {
      data: policies,
      currentPage: pageNumber,
      hasNextPage: endIndex < totalPoliciesCount,
      hasPreviousPage: pageNumber > 1,
      nextPage: endIndex < totalPoliciesCount ? pageNumber + 1 : null,
      previousPage: pageNumber > 1 ? pageNumber - 1 : null,
      totalPagesCount: Math.ceil(totalPoliciesCount / pageSize),
      totalPoliciesCount,
    };

    res.status(200).json(result);
  } catch (err) {
    console.error("Error while fetching policies:", err);
    res.status(500).json({ message: "Something went wrong", error: err });
  }
};


exports.getMgPolicies = async (req, res) => {
  try {
    const mgPolicies = await Policy.find({ policyType: "1" });
    if (mgPolicies.length === 0) {
      return res.status(404).json({ message: "No MG policies found" });
    }
    res
      .status(200)
      .json({ message: "MG policies fetched successfully", data: mgPolicies });
  } catch (err) {
    console.error("Error while getting MG policies:", err);
    res.status(500).json({ message: "Something went wrong", error: err });
  }
};

exports.getMbPolicies = async (req, res) => {
  try {
    const mbPolicies = await Policy.find({ policyType: "2" });

    if (mbPolicies.length === 0) {
      return res.status(404).json({ message: "No MB policies found" });
    }

    res
      .status(200)
      .json({ message: "MB policies fetched successfully", data: mbPolicies });
  } catch (err) {
    console.error("Error while getting MB policies:", err);
    res.status(500).json({ message: "Something went wrong", error: err });
  }
};

exports.disablePolicy = async (req, res) => {
  try {
    const { policyId } = req.params;

    const policy = await Policy.findById(policyId);
    const agent = await User.findById(policy.userId);
    if (!policy) {
      return res.status(404).json({ message: "Policy not found" });
    }

    if (!policy.approvedAt) {
      return res
        .status(403)
        .json({ message: "Policy must be approved before it can be disabled" });
    }

    const approvedDate = new Date(policy.approvedAt);
    const currentDate = new Date();
    const diffInDays = Math.floor(
      (currentDate - approvedDate) / (1000 * 60 * 60 * 24)
    );

    if (diffInDays > 15) {
      return res.status(403).json({
        message: "Policy cannot be disabled after 15 days of creation",
      });
    }

    policy.isDisabled = true;
    const oneMonthFromApproval = new Date(approvedDate);
    oneMonthFromApproval.setMonth(approvedDate.getMonth() + 1);
    policy.disabledAt = oneMonthFromApproval;

    await policy.save();
    await agentCancelledPolicy(
      agent.email,
      policy.customerName,
      agent.agentName,
      policy.policyId,
      policy.vehicleModel
    );

    res
      .status(200)
      .json({ message: "Policy disabled successfully", data: policy });
  } catch (err) {
    console.error("Error disabling policy:", err);
    res.status(500).json({ message: "Something went wrong", error: err });
  }
};

exports.getMbOptions = async (req, res) => {
  try {
    const mbOptions = await mbData.find({});
    res.status(200).json({ mbOptions });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Something went wrong" });
  }
};
exports.getMgOptions = async (req, res) => {
  try {
    const mgOptions = await mgData.find();
    res.status(200).json({ mgOptions });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Something went wrong" });
  }
};

exports.updatePolicyStatus = async (req, res) => {
  try {
    const { id, type, ...policyData } = req.body;
    const { reason } = req.query;
    const validTypes = ["yetToApproved", "approved", "rejected", "approvedReq"];

    // Validate policy type
    if (!validTypes.includes(type)) {
      return res.status(400).json({ message: "Invalid policy type." });
    }

    // Find the policy by ID
    const policy = await Policy.findById(id);
    if (!policy) {
      return res.status(404).json({ message: "Policy not found." });
    }

    const agent = await User.findById(policy.userId);

    const requiredFields = [
      "userId",
      "customerName",
      "address",
      "contactNumber",
      "vehicleManufacturer",
      "vehicleModel",
      "vehicleIdNumber",
      "extWarrantyStartDate",
      "extWarrantyEndDate",
      "product",
      "productPrice",
      "totalPrice",
    ];

    for (let field of requiredFields) {
      if (field !== "userId" && !policyData[field] && !policy[field]) {
        return res
          .status(400)
          .json({ message: `The field ${field} is required.` });
      }
    }

    if (type === "approvedReq" && policy.isCancelReq === "reqCancel") {
      policy.isCancelReq = "approvedReq";
      await policy.save();

      return res.status(200).json({ 
        message: "Cancellation request approved.", 
        isCancelReq: policy.isCancelReq 
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

      policy.rejectionReason = reason;
      policy.rejectedAt = deletionDate;
      policy.policyStatus = "rejected";

      await policy.save();
      console.log(
        `Policy with ID: ${id} scheduled for deletion with reason: ${reason}.`
      );

      await sendAgentRejected(
        agent.email,
        policy.customerName,
        agent.agentName,
        reason
      );

      return res.status(200).json({ message: "Policy rejected", policy });
    }

    // Handle approval case
    if (type === "approved") {
      policy.policyStatus = "approved";
      policy.approvedAt = new Date();

      // Only generate policy ID if it is not present
      if (!policy.policyId) {
        const currentYear = new Date().getFullYear();
        const nextPolicyNumber = await getNextPolicyId();
        const policyId = `360-RG-${currentYear}-${nextPolicyNumber
          .toString()
          .padStart(4, "0")}`;
        policy.policyId = policyId;
      }

      policy.policyStatus = "approved";
      policy.approvedAt = new Date();

      await policy.save();

      await sendAgentAccepted(
        agent.email,
        policy.customerName,
        agent.agentName,
        policy.policyId,
        policy.vehicleModel
      );

      await sendCustomerAccepted(
        policy.email,
        policy.customerName,
        policy.policyId,
        policy.vehicleModel
      );

      return res.status(200).json({ message: "Policy approved", policy });
    }

    policy.policyStatus = "yetToApproved";

    await policy.save();

    return res
      .status(200)
      .json({ message: "Policy Status Changed Successfully.", policy });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Internal Server Error" });
  }
};

exports.getPendingPolicy = async (req, res) => {
  try {
    const { page, limit, manufacturer } = req.query; // Default values for page and limit
    const pageNumber = parseInt(page) || 1;  // Ensure it's a valid number
    const pageSize = parseInt(limit) || 10;  // Ensure it's a valid number
    const startIndex = (pageNumber - 1) * pageSize;
    
  const query = { 
  $or: [
    { policyStatus: "yetToApproved" },
    { isCancelReq: "reqCancel" }
  ]
};

    if (manufacturer) {
      query.vehicleManufacturer = manufacturer;
    }

    const totalPoliciesCount = await Policy.countDocuments(query);

    const policies = await Policy.find(query)
      .sort({ createdAt: -1 })
      .limit(pageSize)
      .skip(startIndex);

    const totalPagesCount = Math.ceil(totalPoliciesCount / pageSize);
    const result = {
      data: policies,
      currentPage: pageNumber,
      hasNextPage: pageNumber < totalPagesCount,
      hasPreviousPage: pageNumber > 1,
      nextPage: pageNumber < totalPagesCount ? pageNumber + 1 : null,
      previousPage: pageNumber > 1 ? pageNumber - 1 : null,
      totalPagesCount,
      totalPoliciesCount,
    };

    res.status(200).json(result);
  } catch (err) {
    console.error("Error while fetching policies:", err);
    res.status(500).json({ message: "Something went wrong", error: err });
  }
};


exports.getPolicyById = async (req, res) => {
  const { id } = req.params;
  const { page = 1, limit = 10 } = req.query;
  const pageNumber = parseInt(page);
  const pageSize = parseInt(limit);
  const startIndex = (pageNumber - 1) * pageSize;

  try {
    const totalPoliciesCount = await Policy.countDocuments({
      $or: [{ userId: id }, { _id: id }],
      policyStatus: { $ne: "yetToApproved" },
    });

    const data = await Policy.find({
      $or: [{ userId: id }, { _id: id }],
      // policyStatus: { $ne: "yetToApproved" },
    })
      .skip(startIndex)
      .limit(pageSize);

    if (!data || data.length === 0) {
      return res.status(404).json({ message: "No policy available to show" });
    }

    const result = {
      data: data,
      currentPage: pageNumber,
      hasNextPage: startIndex + data.length < totalPoliciesCount,
      hasPreviousPage: pageNumber > 1,
      nextPage:
        startIndex + data.length < totalPoliciesCount ? pageNumber + 1 : null,
      previousPage: pageNumber > 1 ? pageNumber - 1 : null,
      totalPagesCount: Math.ceil(totalPoliciesCount / pageSize),
      totalPoliciesCount,
    };

    res.status(200).json(result);
  } catch (err) {
    console.error("Error fetching policy data:", err);
    res.status(500).json({ message: "Failed to fetch policy data" });
  }
};

exports.getFilteredPolicyById = async (req, res) => {
  const { id } = req.params;
  const { page = 1, limit = 10 } = req.query;
  const pageNumber = parseInt(page);
  const pageSize = parseInt(limit);
  const startIndex = (pageNumber - 1) * pageSize;

  try {
    const totalPoliciesCount = await Policy.countDocuments({
      $or: [{ userId: id }, { _id: id }],
      policyStatus: { $ne: "yetToApproved" },
    });

    const data = await Policy.find({
      $or: [{ userId: id }, { _id: id }],
      policyStatus: { $nin: ["yetToApproved", "rejected"] },
    })
      .skip(startIndex)
      .limit(pageSize);

    if (!data || data.length === 0) {
      return res.status(404).json({ message: "No policy available to show" });
    }

    const result = {
      data: data,
      currentPage: pageNumber,
      hasNextPage: startIndex + data.length < totalPoliciesCount,
      hasPreviousPage: pageNumber > 1,
      nextPage:
        startIndex + data.length < totalPoliciesCount ? pageNumber + 1 : null,
      previousPage: pageNumber > 1 ? pageNumber - 1 : null,
      totalPagesCount: Math.ceil(totalPoliciesCount / pageSize),
      totalPoliciesCount,
    };

    res.status(200).json(result);
  } catch (err) {
    console.error("Error fetching policy data:", err);
    res.status(500).json({ message: "Failed to fetch policy data" });
  }
};

exports.getCancelledPolicy = async (req, res) => {
  try {
    const { page, limit } = req.query;

    const skip = (page - 1) * limit;

    const totalPoliciesCount = await Policy.countDocuments({
      isDisabled: true,
    });
    const pageSize = limit || 10;
    const policies = await Policy.find({ isDisabled: true })
      .skip(skip)
      .limit(limit);

    if (policies.length === 0) {
      return res.status(404).json({ message: "No Cancelled policies found" });
    }

    const totalPages = Math.ceil(totalPoliciesCount / pageSize);

    res.status(200).json({
      message: "Cancelled Policy data",
      data: policies,
      currentPage: page,
      totalPagesCount: totalPages,
      totalPoliciesCount: totalPoliciesCount,
    });
  } catch (err) {
    console.error("Error while fetching cancelled policies:", err);
    res.status(500).json({ message: "Something went wrong", error: err });
  }
};

exports.getCancelledPolicyCount = async (req, res) => {
  try {
    const count = await Policy.countDocuments({ isDisabled: true });
    res.status(200).json({ message: "Cancelled Policy count", count });
  } catch (err) {
    console.error("Error while counting cancelled policies:", err);
    res.status(500).json({ message: "Something went wrong", error: err });
  }
};

exports.getAllPolicyCount = async (req, res) => {
  try {
    const count = await Policy.countDocuments({
      isDisabled: { $ne: true },
      policyStatus: { $nin: ["yetToApproved", "rejected"] },
    });
    res.status(200).json({ message: "Active Policy count", count });
  } catch (err) {
    console.error("Error while counting policies:", err);
    res.status(500).json({ message: "Something went wrong", error: err });
  }
};

exports.downloadPolicyCsv = async (req, res) => {
  try {
    const { vehicleManufacturer } = req.query;
    console.log(vehicleManufacturer, "barnd");
    let query = { 
      $and: [
        { isDisabled: { $ne: true } }, 
        { policyStatus: 'approved' }
      ]
    };
    
    if (vehicleManufacturer) {
      query.vehicleManufacturer = vehicleManufacturer;
    }
    const data = await Policy.find(query);

    const csvData = data.map((policy) => ({
      "Customer Name": policy.customerName || "",
      "Pan Number": policy.panNumber || "",
      Address: policy.address || "",
      "Contact Number": policy.contactNumber || "",
      "Gst Number": policy.customerGstNumber || "",
      "Vehicle Manufacturer": policy.vehicleManufacturer || "",
      "Vehicle Model": policy.vehicleModel || "",
      Variant: policy.variant || "",
      "Vehicle Id Number": policy.vehicleIdNumber || "",
      "Vehicle Reg Number": policy.vehicleRegNumber || "",
      "Ex-showroom Price": policy.exshowroomPrice || "",
      "Fuel Type": policy.fuelType || "",
      "Vehicle Purchase Date": policy.vehiclePurchaseDate || "",
      "Odometer Reading": policy.odometerReading || "",
      Price: policy.price || "",
      "Cooling Off Period": policy.coolingOffPeriod || "",
      "Extended Warranty Start Date": policy.extWarrantyStartDate || "",
      "Extended Warranty End Date": policy.extWarrantyEndDate || "",
      Product: policy.product || "",
      "Product Price": policy.productPrice || "",
      Gst: policy.gst || "",
      "Total Price": policy.totalPrice || "",
      "Current Status": policy.policyStatus || "",
      "Transaction Id": policy.transactionId || "",
    }));

    const csvDataString = json2csv(csvData, {
      fields: [
        "Customer Name",
        "Pan Number",
        "Address",
        "Contact Number",
        "Customer Gst Number",
        "Vehicle Manufacturer",
        "Vehicle Model",
        "Variant",
        "Vehicle Id Number",
        "Vehicle Reg Number",
        "Ex-showroom Price",
        "Fuel Type",
        "vehicle Purchase Date",
        "Odometer Reading",
        "Price",
        "Cooling Off Period",
        "Extended Warranty Start Date",
        "Extended Warranty End Date",
        "Product",
        "Product Price",
        "Gst",
        "Total Price",
        "Current Status",
        "Transaction Id",
      ],
    });

    const folderPath = path.join(__dirname, "..", "csv");
    const filePath = path.join(folderPath, "exportedData.csv");

    if (!fs.existsSync(folderPath)) {
      fs.mkdirSync(folderPath);
    }

    fs.writeFileSync(filePath, csvDataString);

    res.download(filePath, "policyData.csv", (err) => {
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


exports.cancelFromAgentRequest = async (req, res) => {
  const { id } = req.params;

  try {
    if (id) {
      const policy = await Policy.findById(id);

      if (!policy) {
        return res.status(404).json({ message: 'Policy not found' });
      }

      policy.isCancelReq = "reqCancel"; 
      await policy.save();

      return res.status(200).json({ message: 'Cancellation request submitted successfully', policy });
    } else {
      return res.status(400).json({ message: 'Policy ID is required' });
    }
  } catch (error) {
    return res.status(500).json({ message: 'Internal server error', error: error.message });
  }
};

exports.policyResubmit = async (req, res) => {
  const { policyId } = req.query;

  try {
    const policy = await Policy.findOne({ _id: policyId });

    if (!policy) {
      return res.status(404).json({ message: "policy not found" });
    }
    policy.policyStatus = "yetToApproved"
    await policy.save();
      
    return res
      .status(200)
      .json({ message: "policy fetched successfully", policy });
  } catch (error) {
    res.status(500).json({ message: "Something went wrong", error });
    console.log(error);
  }
};


exports.policyResubmit = async (req, res) => {
  const { policyId } = req.query;

  try {
    const policy = await Policy.findById(policyId);

    if (!policy) {
      return res.status(404).json({ message: "Policy not found" });
    }

    policy.policyStatus = "yetToApproved";
    await policy.save(); 

    return res.status(200).json({
      message: "Policy updated successfully",
      policy, 
    });
  } catch (error) {
    console.error(error); 
    return res.status(500).json({ message: "Something went wrong", error });
  }
};










exports.getPolicies = async (req, res) => {
  const { policyStatus, search = "", page = 1, limit = 10, userId } = req.query;

  try {
    // Validate userId if present
    if (userId && !mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({ message: "Invalid userId format" });
    }

    // Build query filters
    const filters = {
      ...(userId && { userId: new mongoose.Types.ObjectId(userId) }), // Convert userId to ObjectId
      ...(policyStatus && { policyStatus }), // Filter by policyStatus if provided
      ...(search && {
        $or: [
          { vehicleEngineNumber: { $regex: search, $options: "i" } }, // Search by vehicle engine number
          { vehicleRegNumber: { $regex: search, $options: "i" } }, // Search by vehicle registration number
          { policyId: { $regex: search, $options: "i" } }, // Search by policy ID
        ],
      }),
    };

    // Pagination calculation
    const skip = (page - 1) * limit;
    const limitNum = Number(limit);

    // Build the aggregation pipeline
    const policiesPipeline = [
      { $match: filters }, // Match policies based on filters
     
      { $sort: { createdAt: -1 } }, // Sort by creation date (newest first)
      { $skip: skip }, // Skip documents for pagination
      { $limit: limitNum }, // Limit the number of documents per page
    ];

    // Execute the aggregation pipeline
    const policies = await Policy.aggregate(policiesPipeline);

    // Count total documents matching the filters
    const totalPolicies = await Policy.countDocuments(filters);

    // Handle case where no policies are found
    if (policies.length === 0) {
      return res.status(404).json({ message: "No policies found" });
    }

    // Return the fetched policies and pagination info
    return res.status(200).json({
      message: "Policies fetched successfully",
      policies,
      pagination: {
        currentPage: Number(page),
        totalPages: Math.ceil(totalPolicies / limitNum),
        totalPolicies,
      },
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Something went wrong", error });
  }
};
