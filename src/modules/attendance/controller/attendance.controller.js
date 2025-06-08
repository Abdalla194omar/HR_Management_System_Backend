import Attendance from "../../../../DB/model/Attendence.js";
import AppError from "../../../utils/AppError.js";
import asyncHandler from "../../../utils/asyncHandeler.js";
import Employee from "../../../../DB/model/Employee.js";
import * as calc from "../../../utils/AttendanceCalc.js";

// GET AND FILTER ATTENDANCE
export const getAttendance = asyncHandler(async (req, res, next) => {
  const { name, department, from, to } = req.query;
  console.log(req.query);
  return res.json({ message: "getAttendance", data: req.query });
});

// CREATE CHECKIN
export const createCheckIn = asyncHandler(async (req, res, next) => {
  const { employee, date, checkInTime, status } = req.body;
  const attendanceFound = await Attendance.findOne({ date, employee });
  if (attendanceFound) return next(new AppError("This Attendance is already found for this date", 409));
  const employeeFound = await Employee.findById(employee);
  if (!employeeFound) return next(new AppError("Employee not found", 404));
  if (new Date(date) < new Date(employeeFound.hireDate)) return next(new AppError("Can't create attendance date before employee hire date", 400));
  await calc.checkForHolidays(date, employeeFound);
  const checkInData = { employee, date, status };
  if (status === "Present") {
    Object.assign(checkInData, {
      checkInTime,
      lateDurationInHours: calc.calcLateDurationInHours(checkInTime, employeeFound),
    });
  }
  const newCheckIn = await Attendance.create(checkInData);
  return res.status(201).json({
    message: "CheckIn added successfully",
    data: newCheckIn,
  });
});

// CREATE CHECKOUT
export const createCheckOut = asyncHandler(async (req, res, next) => {
  const { checkOutTime } = req.body;
  const { id } = req.params;
  const attendanceFound = await Attendance.findById(id).populate("employee", "defaultCheckInTime defaultCheckOutTime");
  if (!attendanceFound.checkInTime) return next(new AppError("You must provide checkIn time first", 400));
  calc.checkOutAfterCheckIn(attendanceFound.checkInTime, checkOutTime);
  attendanceFound.checkOutTime = checkOutTime;
  attendanceFound.overtimeDurationInHours = calc.calcOvertimeDurationInHours(checkOutTime, attendanceFound.employee);
  await attendanceFound.save();
  return res.status(201).json({
    message: "checkOut added successfully",
    data: attendanceFound,
  });
});

// CREATE ATTENDANCE
export const createAttendance = asyncHandler(async (req, res, next) => {
  const { employee, date, checkInTime, checkOutTime, status } = req.body;

  // check for attendance if it's exist in database already
  const attendanceFound = await Attendance.findOne({ date, employee });
  if (attendanceFound) return next(new AppError("This Attendance is already found for this date", 409));

  // check for employee and hireDate and get default checkIn and checkOut of employee
  const employeeFound = await Employee.findById(employee);
  if (!employeeFound) return next(new AppError("Employee not found", 404));
  if (new Date(date) < new Date(employeeFound.hireDate)) return next(new AppError("Can't create attendance date before employee hire date", 400));

  // check for holidays
  await calc.checkForHolidays(date, employeeFound);

  const attendanceData = {
    employee,
    date,
    status,
  };

  // if present:
  // we will check that checkOut is after checkIn time
  // we will need checkIn and checkOut and calculate late and overtime hours
  // we will add them to attendance data that will be added in database
  if (status === "Present") {
    calc.checkOutAfterCheckIn(checkInTime, checkOutTime);

    Object.assign(attendanceData, {
      checkInTime,
      checkOutTime,
      lateDurationInHours: calc.calcLateDurationInHours(checkInTime, employeeFound),
      overtimeDurationInHours: calc.calcOvertimeDurationInHours(checkOutTime, employeeFound),
    });
  }

  // if present (already checkIn and checkOut and late and overtime hours are added to attendance data)
  // if absent or on leave it will not add checkIn or checkOut and will set late and overtime hours as zeros
  const newAttendance = await Attendance.create(attendanceData);

  return res.status(201).json({
    message: "Attendance added successfully",
    data: newAttendance,
  });
});

// UPDATE ATTENDANCE
export const updateAttendance = asyncHandler(async (req, res, next) => {
  const { checkInTime, checkOutTime, status } = req.body;
  const { id } = req.params;
  const attendance = await Attendance.findById(id).populate("employee", "defaultCheckInTime defaultCheckOutTime");
  if (status === "Present") {
    if (checkInTime) {
      attendance.checkInTime = checkInTime;
      attendance.lateDurationInHours = calc.calcLateDurationInHours(checkInTime, attendance.employee);
    }
    if (checkOutTime) {
      calc.checkOutAfterCheckIn(checkInTime, checkOutTime);
      attendance.checkOutTime = checkOutTime;
      attendance.overtimeDurationInHours = calc.calcOvertimeDurationInHours(checkOutTime, attendance.employee);
    }
    if (checkOutTime === "") {
      attendance.checkOutTime = undefined;
      attendance.overtimeDurationInHours = 0;
    }
  } else if (status === "Absent") {
    attendance.checkInTime = undefined;
    attendance.checkOutTime = undefined;
    attendance.lateDurationInHours = 0;
    attendance.overtimeDurationInHours = 0;
  }
  attendance.status = status || attendance.status;
  await attendance.save();
  return res.status(200).json({
    message: "Attendance Updated successfully",
    data: attendance,
  });
});

// DELETE ATTENDANCE
export const deleteAttendance = asyncHandler(async (req, res, next) => {
  const { id } = req.params;
  const attendance = await Attendance.findById(id);
  if (!attendance) return next(new AppError("Attendance not found", 404));
  attendance.isDeleted = true;
  attendance.deletedAt = new Date();
  await attendance.save();
  res.status(200).json({ message: "Attendance deleted successfully" });
});
