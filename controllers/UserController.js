const jwt = require("jsonwebtoken");
const userSchema = require("../model/User");
const dotenv = require("dotenv");
const fs = require("fs");
// const { encryptText, decryptText } = require("../Utility/utilityFunc");
const { sendAgentCredEmail } = require("../helper/emailFunction");
const json2csv = require("json2csv").parse;
dotenv.config();

exports.signinController = async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ message: "Invalid Field" });
  }

  try {
    const existingUser = await userSchema.findOne({ email });
    if (!existingUser) {
      return res.status(400).json({ message: "User not found" });
    }

    const token = jwt.sign(
      {
        email: existingUser.email,
        id: existingUser._id,
      },
      process.env.SECRET_KEY,
      { expiresIn: "24h" }
    );

    res.status(200).json({ token, user: existingUser });
  } catch (err) {
    console.log(err);
    res.status(500).json({ message: "Something went wrong" });
  }
};

exports.getUsersData = async (req, res) => {
  try {
    const user = req.user;

    if (!user) {
      return res.status(401).json({ message: "User not authenticated" });
    }

    const { password, confirmPassword, ...userData } = user.toObject();

    res.status(200).json(userData);
  } catch (err) {
    console.error("Error fetching user data:", err);
    res.status(500).json({ message: "Failed to fetch user data" });
  }
};

exports.getUserById = async (req, res) => {
  const { userId } = req.params;
  console.log(`Fetching data for userId: ${userId}`);
  try {
    const user = await userSchema.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    const { password, confirmPassword, ...userData } = user.toObject();
    res.status(200).json(userData);
  } catch (err) {
    console.error("Error fetching user data:", err);
    res.status(500).json({ message: "Failed to fetch user data" });
  }
};
//fetch password and confirmpassword as well
exports.getUserDataById = async (req, res) => {
  const { userId } = req.params;
  console.log(`Fetching data for userId: ${userId}`);
  try {
    const user = await userSchema.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const { password, confirmPassword, ...userData } = user.toObject();
    const response = {
      ...userData,
      password: user.password,
      confirmPassword: user.confirmPassword,
    };
    res.status(200).json(response);
  } catch (err) {
    console.error("Error fetching user data:", err);
    res.status(500).json({ message: "Failed to fetch user data" });
  }
};

exports.addAgent = async (req, res) => {
  try {
    const agentData = req.body;
    const { id } = req.query;
    const {
      email,
      password,
      confirmPassword,
      contactNumber,
      agentId,
      agentName,
    } = agentData;

    if (id) {
      const existingAgent = await userSchema.findById(id);

      if (!existingAgent) {
        return res.status(404).json({ message: "Agent not found for update" });
      }

      const existingContactAgent = await userSchema.findOne({
        contact: contactNumber,
        _id: { $ne: id },
      });

      const existingEmailAgent = await userSchema.findOne({
        email: email,
        _id: { $ne: id },
      });

      if (existingContactAgent || existingEmailAgent) {
        return res
          .status(400)
          .json({ message: "Email or contact number already exists" });
      }

      const updatedAgent = await userSchema.findByIdAndUpdate(
        id,
        {
          ...agentData,
          ...(password && { password: password }),
          ...(confirmPassword && { confirmPassword: confirmPassword }),
        },
        { new: true }
      );

      if (updatedAgent) {
        await sendAgentCredEmail(email, password, agentName, null, null);
        return res.status(200).json({ message: "Agent updated successfully" });
      } else {
        return res.status(404).json({ message: "Agent not found" });
      }
    } 

      const newAgent = new userSchema({
        ...agentData,
        password: password,
        confirmPassword: confirmPassword,
      });

      await newAgent.save();
      // await sendAgentCredEmail(email, password, agentName);

      return res.status(201).json({ message: "Agent added successfully" });
 
  } catch (err) {
    console.log("Error saving agent data:", err);
    res
      .status(500)
      .json({ message: "Something went wrong", error: err.message });
  }
};

exports.deleteAgent = async (req, res) => {
  try {
    const { id } = req.params;
    console.log(id);
    const deletedAgent = await userSchema.findByIdAndDelete(id);

    if (!deletedAgent) {
      return res.status(404).json({ message: "Agent not found" });
    }

    res.status(200).json({ message: "Agent deleted successfully" });
  } catch (err) {
    console.error("Error deleting agent:", err);
    res.status(500).json({ message: "Something went wrong", error: err });
  }
};

exports.getAllAgents = async (req, res) => {
  try {
    const agents = await userSchema.find();

    if (agents.length === 0) {
      return res.status(404).json({ message: "No agents found" });
    }
    res
      .status(200)
      .json({ message: "Agents retrieved successfully", data: agents });
  } catch (err) {
    console.error("Error retrieving agents:", err);
    res.status(500).json({ message: "Something went wrong", error: err });
  }
};

exports.getMGagent = async (req, res) => {
  try {
    const query = { roleType: "2", brandName: "MG" };
    const mgAgents = await userSchema.find(query);
    if (mgAgents.length === 0) {
      return res.status(404).json({ message: "No MG agents found" });
    }
    res.status(200).json({ message: "All MG Agents data", mgAgents });
  } catch (err) {
    console.error("Error while getting MG agents:", err);
    res.status(500).json({ message: "Something went wrong", error: err });
  }
};

exports.getMBagent = async (req, res) => {
  try {
    const query = { roleType: "2", brandName: "MB" };

    const mbAgents = await userSchema.find(query);
    if (mbAgents.length === 0) {
      return res.status(404).json({ message: "No MG agents found" });
    }
    res.status(200).json({ message: "All MB Agents data", mbAgents });
  } catch (err) {
    console.error("Error while getting MG agents:", err);
    res.status(500).json({ message: "Something went wrong", error: err });
  }
};

exports.getUserDataByBrand = async (req, res) => {
  const { brandName } = req.query;

  try {
    const query = { roleType: "1", brandName };
    const teamMembers = await userSchema.find(query);

    // Send the response
    return res.status(200).json({ success: true, data: teamMembers });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ message: "Something went wrong", error });
  }
};


exports.downloadCsv = async (req, res) => {
  try {
    const data = await User.find({});

    const csvData = json2csv(data, {
      fields: [
        "brandName",
        "agentId",
        "agentName",
        "email",
        "contact",
        "roleType",
      ],
    });

    const filePath = "exportedData.csv";
    fs.writeFileSync(filePath, csvData);

    res.download(filePath, "exportedData.csv", (err) => {
      if (err) {
        console.error(err);
        res.status(500).send("Internal Server Error");
      } else {
        fs.unlink(filePath, (unlinkErr) => {
          if (unlinkErr) {
            console.error("Error deleting file:", unlinkErr);
          }
        });
      }
    });
  } catch (err) {
    console.error(err);
    res.status(500).send("Internal Server Error");
  }
};
