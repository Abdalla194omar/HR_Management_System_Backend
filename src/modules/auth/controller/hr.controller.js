
import HR from "../../../../DB/model/HR.js";
import asyncHandler from "express-async-handler";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";




export const registerHR = asyncHandler(async (req, res) => {
  const { email, password, name } = req.body;

  const existingHR = await HR.findOne({ email });
  if (existingHR) {
    return res.status(400).json({ error: "Email already exists" });
  }

  const hr = new HR({ email, password, name });
  await hr.save();

  const token = jwt.sign({ id: hr._id, role: "HR" }, "secret123", {
    expiresIn: "1h",
  });

  res.status(201).json({ message: "HR registered successfully", token });
});

export const loginHR = asyncHandler(async (req, res) => {
  try {
    const { email, password } = req.body;

    const hr = await HR.findOne({ email });
    if (!hr) {
      return res.status(401).json({ error: "Invalid email or password" });
    }

    console.log("Stored hash:", hr.password); 
    console.log("Entered password:", password); 

    const isMatch = await bcrypt.compare(password, hr.password);
    console.log("Password match:", isMatch); 

    if (!isMatch) {
      return res.status(401).json({ error: "Invalid email or password" });
    }

    const token = jwt.sign({ id: hr._id, role: "HR" }, "secret123", {
      expiresIn: "1h",
    });

    res.status(200).json({ message: "Login successful", token });
  } catch (error) {
    console.error("Login Error:", error); 
    throw error; 
  }
});