import Attendance from "../../../../DB/model/Attendence.js";
import AppError from "../../../utils/AppError.js";
import asyncHandler from "../../../utils/asyncHandeler.js";
import Employee from "../../../../DB/model/Employee.js";
import Holiday from "../../../../DB/model/Holiday.js";
import { createAttendanceSchema } from "../attendance.validation.js";

// functions to compare times and calculate lateDurationInHours and overtimeDurationInHours and check that checkOut after checkIn
const checkOutAfterCheckIn = (checkInTime, checkOutTime) => {
  if (timeToMinutes(checkInTime) > timeToMinutes(checkOutTime))
    return new AppError("checkOut time cannot be before checkIn time", 400);
};

const timeToMinutes = (time) => {
  const [hours, minutes] = time.split(":").map((number) => parseInt(number));
  const calcMinutes = hours * 60 + minutes;
  return calcMinutes;
};

const minutesToHours = (minutes) => {
  const hours = +(minutes / 60).toFixed(2);
  return hours;
};

const calcLateDurationInHours = (checkInTime, employeeFound) => {
  const minutesOfDefaultCheckInTime = timeToMinutes(
    employeeFound.defaultCheckInTime
  );
  const minutesCheckInTime = timeToMinutes(checkInTime);
  return minutesCheckInTime > minutesOfDefaultCheckInTime
    ? minutesToHours(minutesCheckInTime - minutesOfDefaultCheckInTime)
    : 0;
};

const calcOvertimeDurationInHours = (checkOutTime, employeeFound) => {
  const minutesOfDefaultCheckOutTime = timeToMinutes(
    employeeFound.defaultCheckOutTime
  );
  const minutesCheckOutTime = timeToMinutes(checkOutTime);
  return minutesCheckOutTime > minutesOfDefaultCheckOutTime
    ? minutesToHours(minutesCheckOutTime - minutesOfDefaultCheckOutTime)
    : 0;
};

// CREATE ATTENDANCE
export const createAttendance = asyncHandler(async (req, res, next) => {
  const { employee, date, checkInTime, checkOutTime, status } = req.body;

  // check for employee and get default checkIn and checkOut of employee
  const employeeFound = await Employee.findById(employee);
  if (!employeeFound) return next(new AppError("Employee not found", 404));

  // check for attendance if it's exist in database already
  const attendanceFound = await Attendance.findOne({ date, employee });
  if (attendanceFound)
    return next(
      new AppError("This Attendance is already found for this date", 409)
    );

  if (
    new Date(date) <
    new Date(employeeFound.hireDate)
  )
    return next(
      new AppError("Can't create attendance date before employee hire date", 400)
    );

  // check for holidays
  // await checkForHolidays(date);

  // data of attendace that will be added to database
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
    const checkAfter = checkOutAfterCheckIn(checkInTime, checkOutTime);
    if (checkAfter) return next(checkAfter);

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
