import Attendance from "../../../../DB/model/Attendence.js";
import AppError from "../../../utils/AppError.js";
import asyncHandler from "../../../utils/asyncHandeler.js";

export const createAttendance = asyncHandler(async (req, res, next) => {
  res.json({ message: "attendance added successfully" });
});