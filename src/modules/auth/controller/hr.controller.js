import HR from "../../../../DB/model/HR.js";
import asyncHandler from "express-async-handler";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import AppError from "../../../utils/AppError.js";

export const loginHR = asyncHandler(async (req, res, next) => {
  const { email, password } = req.body;

  const hr = await HR.findOne({ email });
  if (!hr || !(await bcrypt.compare(password, hr.password))) {
    return next(new AppError("Invalid email or password"), 401);
  }

  const token = jwt.sign(
    { id: hr._id, role: "HR", email: hr.email },
    "123pass",
    {
      expiresIn: "1h",
    }
  );

  res.status(200).json({ message: "Login successful", token });
});

export const register = asyncHandler(async (req, res, next) => {
  const { name, email, password } = req.body;

  const hrFound = await HR.findOne({ email });
  if (hrFound) {
    return next(new AppError("HR with this email already exists", 400));
  }

  const hrUser = await HR.create({ name, email, password });

  res.status(201).json({
    message: "HR User Created Successfully",
    data: hrUser,
  });
});
