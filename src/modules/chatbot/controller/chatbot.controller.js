import Employee from "../../../../DB/model/Employee.js";
import asyncHandler from "../../../utils/asyncHandeler.js";
import Attendance from "../../../../DB/model/Attendence.js";
import Department from "../../../../DB/model/Department.js";
import Holiday from "../../../../DB/model/Holiday.js";
import { calculatePayroll } from "../../../utils/PayrollService.js";

let hrChatState = {};

function checkRestart(message, language) {
  const msg = message.toLowerCase();

  if (msg.includes("مرتب") || msg.includes("salary")) {
    hrChatState = { waitingFor: "employeeName" };

    return {
      shouldRestart: true,
      reply:
        language === "ar"
          ? "سنبدأ من جديد.\nمن فضلك ادخل اسم الموظف بالإنجليزي"
          : "Let's start over.\nPlease enter the employee name (in English)",
    };
  }

  return { shouldRestart: false };
}

export const processChat = asyncHandler(async (req, res) => {
  const { message, language } = req.body;
  const msg = message.toLowerCase().trim();

  const monthNames = {
    "01": { ar: "يناير", en: "January" },
    "02": { ar: "فبراير", en: "February" },
    "03": { ar: "مارس", en: "March" },
    "04": { ar: "أبريل", en: "April" },
    "05": { ar: "مايو", en: "May" },
    "06": { ar: "يونيو", en: "June" },
    "07": { ar: "يوليو", en: "July" },
    "08": { ar: "أغسطس", en: "August" },
    "09": { ar: "سبتمبر", en: "September" },
    10: { ar: "أكتوبر", en: "October" },
    11: { ar: "نوفمبر", en: "November" },
    12: { ar: "ديسمبر", en: "December" },
  };

  // === الأسئلة التفاعلية الخاصة بالراتب ===
  if (hrChatState.waitingFor === "employeeName") {
    // if the user wants to restart the salary query
    const restart = checkRestart(message, language);
    if (restart.shouldRestart) {
      return res.json({ reply: restart.reply });
    }

    hrChatState.employeeName = message.trim();
    hrChatState.waitingFor = "month";
    return res.json({
      reply:
        language === "ar"
          ? "من فضلك ادخل رقم الشهر (مثال: 07)"
          : "Please enter the month (e.g., 07)",
    });
  }

  if (hrChatState.waitingFor === "month") {
    // if the user wants to restart the salary query
    const restart = checkRestart(message, language);
    if (restart.shouldRestart) {
      return res.json({ reply: restart.reply });
    }

    hrChatState.month = message.trim();
    hrChatState.waitingFor = "year";
    return res.json({
      reply:
        language === "ar"
          ? "من فضلك ادخل السنة (مثال: 2025)"
          : "Please enter the year (e.g., 2025)",
    });
  }

  if (hrChatState.waitingFor === "year") {
    // if the user wants to restart the salary query
    const restart = checkRestart(message, language);
    if (restart.shouldRestart) {
      return res.json({ reply: restart.reply });
    }

    hrChatState.year = message.trim();

    const { employeeName, month, year } = hrChatState;
    hrChatState = {}; // تصفير الحالة

    const monthName = monthNames[month]?.[language] || month;

    const employee = await Employee.findOne({
      isDeleted: false,
      $expr: {
        $regexMatch: {
          input: { $concat: ["$firstName", " ", "$lastName"] },
          regex: new RegExp(`^${employeeName}$`, "i"),
        },
      },
    });

    if (!employee) {
      return res.json({
        reply:
          language === "ar"
            ? "الموظف غير موجود. تأكد من كتابة الاسم بالإنجليزي كما هو مسجل."
            : "Employee not found. Make sure to enter the name in English as registered.",
      });
    }

    const [holidays, attendance] = await Promise.all([
      Holiday.find({
        $expr: {
          $and: [
            { $eq: [{ $month: "$date" }, parseInt(month)] },
            { $eq: [{ $year: "$date" }, parseInt(year)] },
          ],
        },
      }),
      Attendance.find({
        employee: employee._id,
        $expr: {
          $and: [
            { $eq: [{ $year: "$date" }, parseInt(year)] },
            { $eq: [{ $month: "$date" }, parseInt(month)] },
          ],
        },
      }).populate("employee"),
    ]);

    if (!attendance.length) {
      return res.json({
        reply:
          language === "ar"
            ? "لا يوجد حضور لهذا الموظف في هذا الشهر."
            : "No attendance found for this employee in that month.",
      });
    }

    const payroll = await calculatePayroll(
      employee,
      attendance,
      holidays,
      month,
      year
    );

    return res.json({
      reply:
        language === "ar"
          ? `💰 <strong>مرتب ${employeeName}</strong><br />
    📅 عن شهر <strong>${monthName} ${year}</strong><br />
    💵 <strong>${payroll.netSalary.toFixed(2)} جنيه</strong>`
          : `💰 <strong>Salary for ${employeeName}</strong><br />
    📅 Month: <strong>${monthName} ${year}</strong><br />
    💵 Amount: <strong>${payroll.netSalary.toFixed(2)} EGP</strong>`,
    });
  }

  // === بداية سيناريو طلب المرتب ===
  if (
    (language === "ar" && msg.includes("مرتب")) ||
    (language === "en" && msg.includes("salary"))
  ) {
    hrChatState = { waitingFor: "employeeName" };
    return res.json({
      reply:
        language === "ar"
          ? "من فضلك ادخل اسم الموظف بالإنجليزي"
          : "Please enter the employee name (in English)",
    });
  }

  // عدد الموظفين
  if (
    (language === "ar" && msg.includes("عدد الموظفين")) ||
    (language === "en" && msg.includes("how many employees"))
  ) {
    const totalEmployees = await Employee.countDocuments({ isDeleted: false });
    const reply =
      language === "ar"
        ? `عدد الموظفين الحالي هو: ${totalEmployees}`
        : `Current number of employees is: ${totalEmployees}`;
    return res.json({ reply });
  }

  // عدد الأقسام
  if (
    (language === "ar" && msg.includes("عدد الأقسام")) ||
    (language === "en" && msg.includes("how many departments"))
  ) {
    const totalDepartments = await Department.countDocuments({
      isDeleted: false,
    });
    const reply =
      language === "ar"
        ? `عدد الأقسام الحالية هو: ${totalDepartments}`
        : `Current number of departments is: ${totalDepartments}`;
    return res.json({ reply });
  }

  // الأقسام الموجودة في الشركة
  if (
    (language === "ar" && msg.includes("الأقسام في الشركة")) ||
    (language === "en" && msg.includes("departments in the company"))
  ) {
    const departments = await Department.find({ isDeleted: false });
    const reply =
      language === "ar"
        ? `الأقسام الموجودة في الشركة هي:\n${departments
            .map((depart) => `• ${depart.departmentName}`)
            .join("\n")}`
        : `The departments in the company are:\n${departments
            .map((depart) => `• ${depart.departmentName}`)
            .join("\n")}`;
    return res.json({ reply });
  }

  // الغياب اليومي
  if (
    (language === "ar" && msg.includes("غياب النهارده")) ||
    (language === "en" && msg.includes("absent today"))
  ) {
    const todayDate = new Date();
    const todayUtcDate = new Date(
      Date.UTC(
        todayDate.getUTCFullYear(),
        todayDate.getUTCMonth(),
        todayDate.getUTCDate()
      )
    );
    const tomorrowUtcDate = new Date(todayUtcDate);
    tomorrowUtcDate.setUTCDate(tomorrowUtcDate.getUTCDate() + 1);

    const absentList = await Attendance.find({
      status: "Absent",
      date: { $gte: todayUtcDate, $lt: tomorrowUtcDate },
    }).populate({
      path: "employee",
      select: "firstName lastName",
    });

    if (absentList.length === 0) {
      return res.json({
        reply:
          language === "ar"
            ? "كل الموظفين حضروا النهاردة "
            : "All employees are present today",
      });
    }

    const names = absentList
      .map((a) => `${a.employee.firstName} ${a.employee.lastName}`)
      .join("-");

    return res.json({
      reply:
        language === "ar"
          ? `الموظفين الغايبين:\n${names}`
          : `Absent employees:\n${names}`,
    });
  }

  //  رد افتراضي
  return res.json({
    reply:
      language === "ar"
        ? "لم أستطع فهم سؤالك. برجاء المحاولة بصيغة مختلفة."
        : "Sorry, I couldn't understand your question. Try rephrasing.",
  });
});
