import HR from "../../../../DB/model/HR.js";
import asyncHandler from "express-async-handler";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";

export const loginHR = asyncHandler(async (req, res, next) => {
  const { email, password } = req.body;

  const hr = await HR.findOne({ email });
  if (!hr || !(await bcrypt.compare(password, hr.password))) {
    return res.status(401).json({ error: "Invalid email or password" });
  }

  const token = jwt.sign({ id: hr._id, role: "HR", email: hr.email }, "123pass", {
  expiresIn: "1h",
});


  res.status(200).json({ message: "Login successful", token });
});

export const register = asyncHandler(async (req, res, next) => {
  const { name, email, password } = req.body;

  const hrFound = await HR.findOne({ email });
  if (hrFound) {
    return res.status(400).json({ error: "HR already exists" });
  }

  const hrUser = await HR.create({ name, email, password });

  res.status(201).json({
    message: "HR User Created Successfully",
    data: hrUser,
  });
});
