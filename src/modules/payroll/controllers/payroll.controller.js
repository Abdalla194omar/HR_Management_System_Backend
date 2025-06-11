import Attendence from "../../../../DB/model/Attendence.js";
import Employee from "../../../../DB/model/Employee.js";
import Holiday from "../../../../DB/model/Holiday.js";
import asyncHandler from "../../../utils/asyncHandeler.js";

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

export function getDayType(date, employee, officialHolidays) {
  const dateStr = date.toISOString().split("T")[0];

  const employeeWeekendNumbers = employee.weekendDays.map((dayName) =>
    dayNameToNumber(dayName)
  );

  if (employeeWeekendNumbers.includes(date.getDay())) {
    return "weekly_holiday";
  }

  if (
    officialHolidays.some((h) => h.date.toISOString().split("T")[0] === dateStr)
  ) {
    return "official_holiday";
  }

  return "working_day";
}

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

    if (dayType === "weekly_holiday") {
      weeklyHolidays++;
    } else if (dayType === "official_holiday") {
      officialHolidaysCount++;
    }
  }

  return { weeklyHolidays, officialHolidaysCount };
}

function isLeap(year) {
  return (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0;
}

function calcMonthDays(month, year) {
  const thirtyOneMonths = [1, 3, 5, 7, 8, 10, 12];
  const thirtyDays = [4, 6, 9, 11];
  if (thirtyOneMonths.includes(parseInt(month))) {
    return 31;
  }
  if (thirtyDays.includes(parseInt(month))) {
    return 30;
  }
  return parseInt(month) === 2 && isLeap(parseInt(month)) ? 28 : 29;
}

function calcAttendedDays(employeeAttendance) {
  let attendedDays = 0;
  for (const day of employeeAttendance) {
    if (day.status === "Present" && day.checkInTime && day.checkOutTime) {
      attendedDays += 1;
    }
  }
  return attendedDays;
}

function calcAbsentDays(employeeAttendance) {
  let absentDays = 0;
  for (const day of employeeAttendance) {
    if (day.status === "Absent") {
      absentDays += 1;
    }
  }
  return absentDays;
}

function calcTotalOverTime(employeeAttendance) {
  let totalOverTime = 0;
  for (const day of employeeAttendance) {
    totalOverTime += day.overtimeDurationInHours;
  }
  return totalOverTime;
}

function calcTotalDeductionTime(employeeAttendance) {
  let totalDeductionTime = 0;
  for (const day of employeeAttendance) {
    totalDeductionTime += day.lateDurationInHours;
  }
  return totalDeductionTime;
}

function calcTotalBonusAmount(
  overTimeType,
  overTimeValue,
  salaryPerHour,
  totalOvertime
) {
  if (overTimeType === "hour") {
    return totalOvertime * overTimeValue * salaryPerHour;
  } else {
    return totalOvertime * overTimeValue;
  }
}

function calcTotalDeductionAmount(
  deductionType,
  deductionValue,
  salaryPerHour,
  TotalDeductionTime
) {
  if (deductionType === "hour") {
    return TotalDeductionTime * deductionValue * salaryPerHour;
  } else {
    return TotalDeductionTime * deductionValue;
  }
}

function calcNetSalary(
  attendedDays,
  holidays,
  weekendDays,
  salaryPerHour,
  workingHoursPerDay,
  totalBonusAmount,
  totalDeductionAmount
) {
  return (
    (attendedDays + holidays + weekendDays) *
      salaryPerHour *
      workingHoursPerDay +
    totalBonusAmount -
    totalDeductionAmount
  );
}

export const getAllPayrolls = asyncHandler(async (req, res, next) => {
  const { month, year } = req.query;

  const [employees, holidays, monthAttendence] = await Promise.all([
    Employee.find(),
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

  let employeesAttendance = [];

  let empPayroll = [];

  //filter each employee attendene
  for (const emp of employees) {
    const employeeAttendance = monthAttendence.filter((a) =>
      a.employee._id.equals(emp._id)
    );
    if (!employeeAttendance || employeeAttendance.length === 0) continue;

    employeesAttendance.push(employeeAttendance);
  }

  for (const employeeAttendance of employeesAttendance) {
    const employee = employeeAttendance[0].employee;
    const { weeklyHolidays, officialHolidaysCount } =
      calcHolidaysInAttendanceRange(
        employee,
        employeeAttendance.map((a) => new Date(a.date)),
        holidays
      );

    const overTimeType = employee.overtimeType;
    const overTimeValue = employee.overtimeValue;
    const deductionType = employee.deductionType;
    const deductionValue = employee.deductionValue;
    const salary = employee.salary;
    const workingHoursPerDay = employee.workingHoursPerDay;
    const monthDays = calcMonthDays(month, year);
    const salaryPerHour = salary / monthDays / workingHoursPerDay;
    const attendedDays = calcAttendedDays(employeeAttendance);
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

    const netSalary = calcNetSalary(
      attendedDays,
      officialHolidaysCount,
      weeklyHolidays,
      salaryPerHour,
      workingHoursPerDay,
      totalBonusAmount,
      totalDeductionAmount
    );
    const payrollData = {
      employee: employee._id,
      month,
      monthDays,
      year,
      attendedDays,
      absentDays: calcAbsentDays(employeeAttendance),
      totalOverTime,
      totalDeductionTime,
      totalBonusAmount,
      totalDeductionAmount,
      netSalary,
    };
    empPayroll.push(payrollData);
  }

  res.status(200).json(empPayroll);
});
