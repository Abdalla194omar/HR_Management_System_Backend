import Attendance from "../../DB/model/Attendence.js";
import Employee from "../../DB/model/Employee.js";

export async function topEmployeesFunc(language) {
  // console.log("topEmployeesFunc");
  const date = new Date();
  const targetMonth = date.getUTCMonth() + 1;
  const targetYear = date.getUTCFullYear();
  const topEmployees = await Attendance.aggregate([
    {
      $match: {
        isDeleted: false,
        status: "Present",
        $expr: {
          $and: [
            { $eq: [{ $month: "$date" }, targetMonth] },
            { $eq: [{ $year: "$date" }, targetYear] },
          ],
        },
      },
    },
    {
      $group: {
        _id: "$employee",
        presentCount: { $sum: 1 },
        lateSum: { $sum: "$lateDurationInHours" },
      },
    },
    {
      $match: {
        lateSum: { $lte: 2 },
      },
    },
    {
      $lookup: {
        from: "employees",
        localField: "_id",
        foreignField: "_id",
        as: "employeeData",
      },
    },
    {
      $unwind: "$employeeData",
    },
  ]);
  if (!topEmployees.length) {
    const noTopEmployeesReply =
      language === "ar"
        ? "لا يوجد موظفين مميزين لهذا الشهر"
        : "There are no top employees for this month";
    return { reply: noTopEmployeesReply };
  }
  // console.log(topEmployees);
  const topEmployeesReply =
    language === "ar"
      ? `الموظفين المميزين لهذا الشهر هم:\n ${topEmployees
          .map(
            (emp) =>
              `• ${emp.employeeData.firstName} ${emp.employeeData.lastName}`
          )
          .join("\n")}`
      : `Top employees for this month are:\n ${topEmployees
          .map(
            (emp) =>
              `• ${emp.employeeData.firstName} ${emp.employeeData.lastName}`
          )
          .join("\n")}`;
  return { reply: topEmployeesReply };
}

export async function lateEmployeesFunc(language) {
  // console.log("lateEmployeesFunc");
  const date = new Date();
  const targetMonth = date.getUTCMonth() + 1;
  const targetYear = date.getUTCFullYear();
  const lateEmployees = await Attendance.aggregate([
    {
      $match: {
        isDeleted: false,
        status: "Present",
        $expr: {
          $and: [
            { $eq: [{ $month: "$date" }, targetMonth] },
            { $eq: [{ $year: "$date" }, targetYear] },
          ],
        },
      },
    },
    {
      $group: {
        _id: "$employee",
        lateSum: { $sum: "$lateDurationInHours" },
      },
    },
    {
      $match: {
        lateSum: { $gte: 5 },
      },
    },
    {
      $lookup: {
        from: "employees",
        localField: "_id",
        foreignField: "_id",
        as: "employeeData",
      },
    },
    {
      $unwind: "$employeeData",
    },
  ]);
  if (!lateEmployees.length) {
    const noLateEmployeesReply =
      language === "ar"
        ? "لا يوجد موظفين متجاوزين لساعات التأخير المسموحة لهذا الشهر"
        : "There are no employees who exceeded the allowed lateness hours this month";
    return { reply: noLateEmployeesReply };
  }
  // console.log(lateEmployees);
  const lateEmployeesReply =
    language === "ar"
      ? `الموظفين المتجاوزين لساعات التأخير المسموحة لهذا الشهر هم: \n ${lateEmployees
          .map(
            (emp) =>
              `• ${emp.employeeData.firstName} ${emp.employeeData.lastName}`
          )
          .join("\n")}`
      : `Employees who exceeded the allowed lateness hours in this month are:\n ${lateEmployees
          .map(
            (emp) =>
              `• ${emp.employeeData.firstName} ${emp.employeeData.lastName}`
          )
          .join("\n")}`;
  return { reply: lateEmployeesReply };
}

export async function attendanceReportFunc(language) {
  // console.log("AttendanceReportFunc");
  const date = new Date();
  const monthName = date.toLocaleString(language === "ar" ? "ar-EG" : "en-US", {
    month: "long",
  });
  const targetMonth = date.getUTCMonth() + 1;
  const targetYear = date.getUTCFullYear();
  const sharedQuery = {
    isDeleted: false,
    $expr: {
      $and: [
        { $eq: [{ $month: "$date" }, targetMonth] },
        { $eq: [{ $year: "$date" }, targetYear] },
      ],
    },
  };
  const [
    totalEmp,
    allAttendance,
    presentAttendance,
    absentAttendance,
    lateAttendance,
    overAttendance,
    lateSum,
    overSum,
  ] = await Promise.all([
    Employee.countDocuments({ isDeleted: false }),
    Attendance.countDocuments({ ...sharedQuery }),
    Attendance.countDocuments({ ...sharedQuery, status: "Present" }),
    Attendance.countDocuments({ ...sharedQuery, status: "Absent" }),
    Attendance.countDocuments({
      ...sharedQuery,
      status: "Present",
      lateDurationInHours: { $gt: 0 },
    }),
    Attendance.countDocuments({
      ...sharedQuery,
      status: "Present",
      overtimeDurationInHours: { $gt: 0 },
    }),
    Attendance.aggregate([
      { $match: { ...sharedQuery, status: "Present" } },
      {
        $group: {
          _id: null,
          lateSum: { $sum: "$lateDurationInHours" },
        },
      },
      {
        $project: { _id: 0, lateSum: "$lateSum" },
      },
    ]),
    Attendance.aggregate([
      { $match: { ...sharedQuery, status: "Present" } },
      {
        $group: {
          _id: null,
          overSum: { $sum: "$overtimeDurationInHours" },
        },
      },
      {
        $project: { _id: 0, overSum: "$overSum" },
      },
    ]),
  ]);
  const lateSumValue = lateSum[0]?.lateSum ?? 0;
  const overSumValue = overSum[0]?.overSum ?? 0;
  const lateAvg = lateAttendance !== 0 ? lateSumValue / lateAttendance : 0;
  const overAvg = overAttendance !== 0 ? overSumValue / overAttendance : 0;
  // console.log(
  //   totalEmp,
  //   allAttendance,
  //   presentAttendance,
  //   absentAttendance,
  //   lateAttendance,
  //   overAttendance,
  //   lateSumValue,
  //   overSumValue,
  //   lateAvg,
  //   overAvg
  // );
  const reply =
    language === "ar"
      ? `<strong>تقرير الحضور لشهر ${monthName}-${targetYear}</strong>\n
👥 عدد الموظفين: ${totalEmp} موظف\n
✅ نسبة الحضور: ${
          allAttendance === 0
            ? 0
            : ((presentAttendance / allAttendance) * 100).toFixed(2)
        }%\n
❌ نسبة الغياب: ${
          allAttendance === 0
            ? 0
            : ((absentAttendance / allAttendance) * 100).toFixed(2)
        }%\n
⚠️ نسبة التأخير: ${
          presentAttendance === 0
            ? 0
            : ((lateAttendance / presentAttendance) * 100).toFixed(2)
        }%\n
🕒❗ متوسط عدد ساعات التأخير: ${lateAvg.toFixed(2)} ساعة\n
🕒➕ متوسط عدد الساعات الإضافية: ${overAvg.toFixed(2)} ساعة\n`
      : `<strong>Attendance Report for ${monthName}-${targetYear}</strong>\n
👥 Total Employees: ${totalEmp}\n
✅ Attendance Rate: ${
          allAttendance === 0
            ? 0
            : ((presentAttendance / allAttendance) * 100).toFixed(2)
        }%\n
❌ Absence Rate: ${
          allAttendance === 0
            ? 0
            : ((absentAttendance / allAttendance) * 100).toFixed(2)
        }%\n
⚠️ Lateness Rate: ${
          presentAttendance === 0
            ? 0
            : ((lateAttendance / presentAttendance) * 100).toFixed(2)
        }%\n
🕒❗ Avg. Late Hours: ${lateAvg.toFixed(2)} hours\n
🕒➕ Avg. Overtime Hours: ${overAvg.toFixed(2)} hours\n`;
  return { reply };
}
