import Attendance from "../../../../DB/model/Attendence.js";
import AppError from "../../../utils/AppError.js";
import asyncHandler from "../../../utils/asyncHandeler.js";
import Employee from "../../../../DB/model/Employee.js";
import {
  checkOutAfterCheckIn,
  checkForHolidays,
  calcLateDurationInHours,
  calcOvertimeDurationInHours,
} from "../../../utils/AttendanceCalc.js";

// GET AND FILTER ATTENDANCE
export const getAttendance = asyncHandler(async (req, res, next) => {
  const { name, department, from, to } = req.query;
  console.log(req.query);
  return res.json({ message: "getAttendance" });
});

// CREATE ATTENDANCE
export const createAttendance = asyncHandler(async (req, res, next) => {
  const { employee, date, checkInTime, checkOutTime, status } = req.body;

  // check for attendance if it's exist in database already
  const attendanceFound = await Attendance.findOne({ date, employee });
  if (attendanceFound)
    return next(
      new AppError("This Attendance is already found for this date", 409)
    );

  // check for employee and get default checkIn and checkOut of employee
  const employeeFound = await Employee.findById(employee);
  if (!employeeFound) return next(new AppError("Employee not found", 404));
  if (new Date(date) < new Date(employeeFound.hireDate))
    return next(
      new AppError(
        "Can't create attendance date before employee hire date",
        400
      )
    );

  // check for holidays
  await checkForHolidays(date, employeeFound);

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
    checkOutAfterCheckIn(checkInTime, checkOutTime);

    Object.assign(attendanceData, {
      checkInTime,
      checkOutTime,
      lateDurationInHours: calcLateDurationInHours(checkInTime, employeeFound),
      overtimeDurationInHours: calcOvertimeDurationInHours(
        checkOutTime,
        employeeFound
      ),
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
  const { employee, date, checkInTime, checkOutTime, status } = req.body;
  const { id } = req.params;
  const attendanceConflict = await Attendance.findOne({
    employee,
    date,
    _id: { $ne: id },
  });
  if (attendanceConflict)
    return next(
      new AppError("This Attendance is already found for this date", 409)
    );
  const employeeFound = await Employee.findById(employee);
  if (!employeeFound) return next(new AppError("Employee not found", 404));
  if (new Date(date) < new Date(employeeFound.hireDate))
    return next(
      new AppError(
        "Can't update attendance date before employee hire date",
        400
      )
    );
  await checkForHolidays(date, employeeFound);
  const attendanceData = {
    employee,
    date,
    status,
    checkInTime: undefined,
    checkOutTime: undefined,
    lateDurationInHours: 0,
    overtimeDurationInHours: 0,
  };
  if (status === "Present") {
    checkOutAfterCheckIn(checkInTime, checkOutTime);
    Object.assign(attendanceData, {
      checkInTime,
      checkOutTime,
      lateDurationInHours: calcLateDurationInHours(checkInTime, employeeFound),
      overtimeDurationInHours: calcOvertimeDurationInHours(
        checkOutTime,
        employeeFound
      ),
    });
  }
  const updatedAttendance = await Attendance.findByIdAndUpdate(
    id,
    { $set: attendanceData },
    {
      new: true,
      runValidators: true,
    }
  );
  return res.status(200).json({
    message: "Attendance Updated successfully",
    data: updatedAttendance,
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
