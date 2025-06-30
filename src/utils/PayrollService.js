import mongoose from "mongoose";

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
function getDayType(date, employee, officialHolidays) {
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

// Main function to calculate payroll for an employee
export async function calculatePayroll(
  emp,
  monthAttendance,
  holidays,
  month,
  year
) {
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
  // const monthDays = calcMonthDays(month, year);
  const monthDays = 30;

  if (monthDays === 0 || workingHoursPerDay === 0 || salary === 0) {
    throw new Error(`Invalid salary or working hours for employee ${emp._id}`);
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

  return {
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
}
