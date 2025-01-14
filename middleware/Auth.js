const jwt = require("jsonwebtoken");
const userSchema = require("../model/User");
const dotenv = require("dotenv");
dotenv.config();



exports.authCheck = async (req, res, next) => {
  try {
    const authHeader = req.get("Authorization");
    if (!authHeader) {
      const error = new Error("Not Authenticated");
      error.statuscode = 401;
      throw error;
    }
    const token = authHeader.split(" ")[1];

    if (!token) {
      return res
        .status(401)
        .json({ message: "Authentication failed, no token found" });
    }

    jwt.verify(token, process.env.SECRET_KEY, async (err, decode) => {
      if (err) {
        return res.status(500).json({ message: "Invalid Token" });
      }

      const user = await userSchema.findById(decode.id);
      if (!user) {
        return res.status(401).json({ message: "User does not exist" });
      }
      req.user = user;
      next();
    });
  } catch (err) {
    console.log("Auth Error", err);
    res.status(500).json({ message: "Internal Server Error" });
  }
};


