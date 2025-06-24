
import HR from "../../../../DB/model/HR.js";
import asyncHandler from "express-async-handler";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";



export const loginHR = asyncHandler(async (req, res, next) => {
  try {
    const { email, password } = req.body;

    console.log("Login Request:", req.body); 

    const hr = await HR.findOne({ email });
    console.log("Found HR:", hr); 

    if (!hr || !(await bcrypt.compare(password, hr.password))) {
      return res.status(401).json({ error: "Invalid email or password" });
    }

    const token = jwt.sign({ id: hr._id, role: "HR" }, "secret123", {
      expiresIn: "1h",
    });
    console.log("Generated Token:", token); 

    res.status(200).json({ message: "Login successful", token });
  } catch (error) {
    console.error("Login Error:", error.stack); 
    next(error); 
  }
});