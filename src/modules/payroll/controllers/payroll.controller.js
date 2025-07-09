import mongoose from "mongoose";
import Attendence from "../../../../DB/model/Attendence.js";
import Employee from "../../../../DB/model/Employee.js";
import Holiday from "../../../../DB/model/Holiday.js";
import Payroll from "../../../../DB/model/Payroll.js";
import AppError from "../../../utils/AppError.js";
import asyncHandler from "../../../utils/asyncHandeler.js";
import { calculatePayroll } from "../../../utils/PayrollService.js";

// API: Get all employees' payroll for a specific month/year
export const getAllPayrolls = asyncHandler(async (req, res, next) => {
  const { month, year } = req.query;

  if (!/^(0[1-9]|1[0-2])$/.test(month) || !/^\d{4}$/.test(year)) {
    return next(new AppError("Year Or Month Format Is Not Valid", 400));
  }

  if (parseInt(year) > new Date().getFullYear()) {
    return next(new AppError("Year Can't be In The Future", 400));
  }

  const [employeesWithAttendance, holidays, monthAttendence] =
    await Promise.all([
      Attendence.distinct("employee", {
        $expr: {
          $and: [
            { $eq: [{ $year: "$date" }, parseInt(year)] },
            { $eq: [{ $month: "$date" }, parseInt(month)] },
          ],
        },
      }),
      Holiday.find({
        $expr: {
          $and: [
            { $eq: [{ $month: "$date" }, parseInt(month)] },
            { $eq: [{ $year: "$date" }, parseInt(year)] },
          ],
        },
      }),
      Attendence.find({
        $expr: {
          $and: [
            { $eq: [{ $year: "$date" }, parseInt(year)] },
            { $eq: [{ $month: "$date" }, parseInt(month)] },
          ],
        },
      }).populate("employee"),
    ]);

  const employees = await Employee.find({
    _id: { $in: employeesWithAttendance },
    isDeleted: { $ne: true },
  })
    .populate("department")
    .then((results) =>
      results.filter((emp) => emp.department && emp.department.deleted !== true)
    );

  let empPayroll = [];

  for (const emp of employees) {
    const employeeAttendance = monthAttendence.filter((a) =>
      a.employee._id.equals(emp._id)
    );

    if (!employeeAttendance || employeeAttendance.length === 0) continue;

    const existingPayroll = await Payroll.findOne({
      employee: emp._id,
      month,
      year,
      isDeleted: false,
    })
      .populate({
        path: "employee",
        populate: {
          path: "department",
        },
      })
      .lean();

    let payrollData;

    const employeeUpdated =
      existingPayroll && emp.updatedAt > existingPayroll.updatedAt;
    const attendanceUpdated = employeeAttendance.some(
      (a) => !existingPayroll || a.updatedAt > existingPayroll.updatedAt
    );
    const holidaysUpdated = holidays.some(
      (h) => !existingPayroll || h.updatedAt > existingPayroll.updatedAt
    );

    if (
      existingPayroll &&
      !attendanceUpdated &&
      !holidaysUpdated &&
      !employeeUpdated
    ) {
      payrollData = existingPayroll;
    } else {
      try {
        payrollData = await calculatePayroll(
          emp,
          employeeAttendance,
          holidays,
          month,
          year
        );
        await Payroll.updateOne(
          { employee: emp._id, month, year },
          { $set: payrollData },
          { upsert: true }
        );
      } catch (error) {
        if (error.message.includes("Invalid salary or working hours")) {
          return next(new AppError(error.message, 400));
        }
        if (error.code === 11000) {
          return next(
            new AppError(
              `Payroll already exists for employee ${emp._id} in ${month}-${year}`,
              400
            )
          );
        }
        return next(
          new AppError(
            `Failed to save payroll for employee ${emp._id}: ${error.message}`,
            500
          )
        );
      }
    }
    empPayroll.push({
      ...payrollData,
      employee: existingPayroll?.employee || emp,
    });
  }
  res.status(200).json(empPayroll);
});

// API: Get payroll for a specific employee for a specific month/year
export const getPayrollByEmployee = asyncHandler(async (req, res, next) => {
  const { month, year, employeeId } = req.query;

  if (!/^(0[1-9]|1[0-2])$/.test(month) || !/^\d{4}$/.test(year)) {
    return next(new AppError("Year Or Month Format Is Not Valid", 400));
  }

  if (parseInt(year) > new Date().getFullYear()) {
    return next(new AppError("Year Can't be In The Future", 400));
  }

  const [holidays, monthAttendance] = await Promise.all([
    Holiday.find({
      $expr: {
        $and: [
          { $eq: [{ $month: "$date" }, parseInt(month)] },
          { $eq: [{ $year: "$date " }, parseInt(year)] },
        ],
      },
    }),
    Attendence.find({
      employee: employeeId,
      $expr: {
        $and: [
          { $eq: [{ $year: "$date" }, parseInt(year)] },
          { $eq: [{ $month: "$date" }, parseInt(month)] },
        ],
      },
    }).populate("employee"),
  ]);

  const employees = await Employee.find({
    _id: { $in: employeesWithAttendance },
    isDeleted: { $ne: true },
  })
    .populate("department")
    .then((result) => result.filter((emp) => !emp.department?.deleted));

  if (!emp || emp.department?.deleted) {
    return next(
      new AppError("Employee not found or department is deleted", 404)
    );
  }

  if (!monthAttendance.length) {
    return next(new AppError("No attendance found for this employee", 404));
  }

  const existingPayroll = await Payroll.findOne({
    employee: emp._id,
    month,
    year,
    isDeleted: false,
  })
    .populate({
      path: "employee",
      populate: { path: "department" },
    })
    .lean();

  const employeeUpdated =
    existingPayroll && emp.updatedAt > existingPayroll.updatedAt;
  const attendanceUpdated = monthAttendance.some(
    (a) => !existingPayroll || a.updatedAt > existingPayroll.updatedAt
  );
  const holidaysUpdated = holidays.some(
    (h) => !existingPayroll || h.updatedAt > existingPayroll.updatedAt
  );

  let payrollData;

  if (
    existingPayroll &&
    !attendanceUpdated &&
    !holidaysUpdated &&
    !employeeUpdated
  ) {
    payrollData = existingPayroll;
  } else {
    try {
      payrollData = await calculatePayroll(
        emp,
        monthAttendance,
        holidays,
        month,
        year
      );
      await Payroll.updateOne(
        { employee: emp._id, month, year },
        { $set: payrollData },
        { upsert: true }
      );
    } catch (error) {
      if (error.message.includes("Invalid salary or working hours")) {
        return next(new AppError(error.message, 400));
      }
      return next(
        new AppError(
          `Failed to save payroll for employee ${emp._id}: ${error.message}`,
          500
        )
      );
    }
  }

  res.status(200).json({
    ...payrollData,
    employee: existingPayroll?.employee || emp,
  });
});
