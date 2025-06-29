import mongoose from "mongoose";
import Attendence from "../../../../DB/model/Attendence.js";
import Employee from "../../../../DB/model/Employee.js";
import Holiday from "../../../../DB/model/Holiday.js";
import Payroll from "../../../../DB/model/Payroll.js";
import AppError from "../../../utils/AppError.js";
import asyncHandler from "../../../utils/asyncHandeler.js";

// Convert day name (e.g. "monday") to numeric value (0-6)
function dayNameToNumber(dayName) {
  const days = {
    sunday: 0,
    monday: 1,
    tuesday: 2,
    wednesday: 3,
    thursday: 4,
    friday: 5,
    saturday: 6,
  };
  return days[dayName.toLowerCase()];
}

// Determine the type of a given day (working, weekend, or official holiday)
export function getDayType(date, employee, officialHolidays) {
  const dateStr = date.toISOString().split("T")[0];
  const employeeWeekendNumbers = employee.weekendDays.map(dayNameToNumber);

  if (employeeWeekendNumbers.includes(date.getDay())) return "weekly_holiday";

  if (
    officialHolidays.some((h) => h.date.toISOString().split("T")[0] === dateStr)
  ) {
    return "official_holiday";
  }

  return "working_day";
}

// Count weekly and official holidays within attendance date range
function calcHolidaysInAttendanceRange(
  employee,
  attendanceDates,
  officialHolidays
) {
  let weeklyHolidays = 0;
  let officialHolidaysCount = 0;

  const firstDate = new Date(Math.min(...attendanceDates));
  const lastDate = new Date(Math.max(...attendanceDates));

  for (
    let date = new Date(firstDate);
    date <= lastDate;
    date.setDate(date.getDate() + 1)
  ) {
    const dayType = getDayType(date, employee, officialHolidays);
    if (dayType === "weekly_holiday") weeklyHolidays++;
    else if (dayType === "official_holiday") officialHolidaysCount++;
  }

  return { weeklyHolidays, officialHolidaysCount };
}

// Check for leap year
function isLeap(year) {
  return (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0;
}

// Get number of days in a specific month
function calcMonthDays(month, year) {
  const thirtyOneMonths = [1, 3, 5, 7, 8, 10, 12];
  const thirtyDays = [4, 6, 9, 11];
  if (thirtyOneMonths.includes(+month)) return 31;
  if (thirtyDays.includes(+month)) return 30;
  return +month === 2 && isLeap(+year) ? 29 : 28;
}

// Count present days
function calcAttendedDays(employeeAttendance) {
  return employeeAttendance.filter(
    (a) => a.status === "Present" && a.checkInTime && a.checkOutTime
  ).length;
}

// Count absent days
function calcAbsentDays(employeeAttendance) {
  return employeeAttendance.filter((a) => a.status === "Absent").length;
}

// Calculate total overtime hours
function calcTotalOverTime(employeeAttendance) {
  return employeeAttendance.reduce(
    (total, a) => total + a.overtimeDurationInHours,
    0
  );
}

// Calculate total late hours
function calcTotalDeductionTime(employeeAttendance) {
  return employeeAttendance.reduce(
    (total, a) => total + a.lateDurationInHours,
    0
  );
}

// Calculate total bonus based on overtime
function calcTotalBonusAmount(
  overTimeType,
  overTimeValue,
  salaryPerHour,
  totalOvertime
) {
  return overTimeType === "hour"
    ? totalOvertime * overTimeValue * salaryPerHour
    : totalOvertime * overTimeValue;
}

// Calculate total deduction based on lateness
function calcTotalDeductionAmount(
  deductionType,
  deductionValue,
  salaryPerHour,
  totalDeductionTime
) {
  return deductionType === "hour"
    ? totalDeductionTime * deductionValue * salaryPerHour
    : totalDeductionTime * deductionValue;
}

// Calculate net salary
function calcNetSalary(
  attendedDays,
  weeklyHolidays,
  officialHolidaysCount,
  salaryPerHour,
  workingHoursPerDay,
  totalBonusAmount,
  totalDeductionAmount
) {
  return (
    (attendedDays + weeklyHolidays + officialHolidaysCount) *
      salaryPerHour *
      workingHoursPerDay +
    totalBonusAmount -
    totalDeductionAmount
  );
}

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
  });
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
      console.log("get existing");
      payrollData = existingPayroll;
    } else {
      console.log("update existing");
      let { weeklyHolidays, officialHolidaysCount } =
        calcHolidaysInAttendanceRange(
          emp,
          employeeAttendance.map((a) => new Date(a.date)),
          holidays
        );

      const overTimeType = emp.overtimeType;
      const overTimeValue = emp.overtimeValue;
      const deductionType = emp.deductionType;
      const deductionValue = emp.deductionValue;
      const salary = emp.salary;
      const workingHoursPerDay = emp.workingHoursPerDay;
      const monthDays = calcMonthDays(month, year);
      if (monthDays === 0 || emp.workingHoursPerDay === 0 || emp.salary === 0) {
        return next(
          new AppError(
            `Invalid salary or working hours for employee ${emp._id}`,
            400
          )
        );
      }
      const salaryPerHour = salary / monthDays / workingHoursPerDay;
      const attendedDays = calcAttendedDays(employeeAttendance);
      const absentDays = calcAbsentDays(employeeAttendance);
      const totalOverTime = calcTotalOverTime(employeeAttendance);
      const totalDeductionTime = calcTotalDeductionTime(employeeAttendance);
      const totalBonusAmount = calcTotalBonusAmount(
        overTimeType,
        overTimeValue,
        salaryPerHour,
        totalOverTime
      );
      const totalDeductionAmount = calcTotalDeductionAmount(
        deductionType,
        deductionValue,
        salaryPerHour,
        totalDeductionTime
      );

      if (attendedDays + absentDays + officialHolidaysCount == 22) {
        weeklyHolidays = 8;
      }

      let netSalary = calcNetSalary(
        attendedDays,
        weeklyHolidays,
        officialHolidaysCount,
        salaryPerHour,
        workingHoursPerDay,
        totalBonusAmount,
        totalDeductionAmount
      );

      netSalary = netSalary < 0 ? 0 : netSalary;

      payrollData = {
        employee: emp._id,
        month,
        year,
        monthDays,
        attendedDays,
        absentDays,
        totalOvertime: totalOverTime,
        totalDeduction: totalDeductionTime,
        totalBonusAmount,
        totalDeductionAmount,
        salaryPerHour,
        netSalary,
      };
      try {
        await Payroll.updateOne(
          { employee: emp._id, month, year },
          { $set: payrollData },
          { upsert: true }
        );
      } catch (error) {
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
          { $eq: [{ $year: "$date" }, parseInt(year)] },
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

  const emp = await Employee.findOne({
    _id: employeeId,
    isDeleted: { $ne: true },
  }).populate("department");

  if (!emp) {
    return next(new AppError("Employee not found", 404));
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
    const { weeklyHolidays, officialHolidaysCount } =
      calcHolidaysInAttendanceRange(
        emp,
        monthAttendance.map((a) => new Date(a.date)),
        holidays
      );

    const overTimeType = emp.overtimeType;
    const overTimeValue = emp.overtimeValue;
    const deductionType = emp.deductionType;
    const deductionValue = emp.deductionValue;
    const salary = emp.salary;
    const workingHoursPerDay = emp.workingHoursPerDay;
    const monthDays = calcMonthDays(month, year);

    if (monthDays === 0 || workingHoursPerDay === 0 || salary === 0) {
      return next(
        new AppError(
          `Invalid salary or working hours for employee ${emp._id}`,
          400
        )
      );
    }

    const salaryPerHour = salary / monthDays / workingHoursPerDay;
    const attendedDays = calcAttendedDays(monthAttendance);
    const absentDays = calcAbsentDays(monthAttendance);
    const totalOverTime = calcTotalOverTime(monthAttendance);
    const totalDeductionTime = calcTotalDeductionTime(monthAttendance);
    const totalBonusAmount = calcTotalBonusAmount(
      overTimeType,
      overTimeValue,
      salaryPerHour,
      totalOverTime
    );
    const totalDeductionAmount = calcTotalDeductionAmount(
      deductionType,
      deductionValue,
      salaryPerHour,
      totalDeductionTime
    );

    let adjustedWeeklyHolidays = weeklyHolidays;
    if (attendedDays + absentDays + officialHolidaysCount === 22) {
      adjustedWeeklyHolidays = 8;
    }

    let netSalary = calcNetSalary(
      attendedDays,
      adjustedWeeklyHolidays,
      officialHolidaysCount,
      salaryPerHour,
      workingHoursPerDay,
      totalBonusAmount,
      totalDeductionAmount
    );

    netSalary = netSalary < 0 ? 0 : netSalary;

    payrollData = {
      employee: emp._id,
      month,
      year,
      monthDays,
      attendedDays,
      absentDays,
      totalOvertime: totalOverTime,
      totalDeduction: totalDeductionTime,
      totalBonusAmount,
      totalDeductionAmount,
      salaryPerHour,
      netSalary,
    };

    await Payroll.updateOne(
      { employee: emp._id, month, year },
      { $set: payrollData },
      { upsert: true }
    );
  }

  res.status(200).json({
    ...payrollData,
    employee: existingPayroll?.employee || emp,
  });
});
