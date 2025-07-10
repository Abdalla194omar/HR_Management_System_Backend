import Employee from "../../../../DB/model/Employee.js";
import asyncHandler from "../../../utils/asyncHandeler.js";
import Attendance from "../../../../DB/model/Attendence.js";
import Department from "../../../../DB/model/Department.js";
import Holiday from "../../../../DB/model/Holiday.js";

const getDaysDifference = (date1, date2) => {
  const diffTime = date2.getTime() - date1.getTime();
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
};

export const processChat = asyncHandler(async (req, res) => {
  const { message, language } = req.body;
  const msg = message.toLowerCase().trim();

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
    const totalDepartments = await Department.countDocuments({ isDeleted: false });
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
    const todayUtcDate = new Date(Date.UTC(todayDate.getUTCFullYear(), todayDate.getUTCMonth(), todayDate.getUTCDate()));
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
        reply: language === "ar" ? "كل الموظفين حضروا النهاردة " : "All employees are present today",
      });
    }

    const names = absentList.map((a) => `${a.employee.firstName} ${a.employee.lastName}`).join(", ");

    return res.json({
      reply: language === "ar" ? `الموظفين الغايبين:\n${names}` : `Absent employees:\n${names}`,
    });
  }

  // الإجازات الرسمية المتبقية خلال هذا الشهر فقط 
  if (
    (language === "ar" &&
      (msg.includes("الإجازات") || msg.includes("اجازات") || msg.includes("إجازات")) &&
      msg.includes("الشهر")) ||
    (language === "en" &&
      (msg.includes("holidays") || msg.includes("holiday")) &&
      msg.includes("month"))
  ) {
    const today = new Date();
    const currentYear = today.getFullYear();
    const currentMonth = today.getMonth();
    const todayMidnight = new Date(currentYear, currentMonth, today.getDate());

    const holidaysThisMonth = await Holiday.find({
      date: {
        $gte: todayMidnight,
        $lt: new Date(currentYear, currentMonth + 1, 1),
      },
      isDeleted: false,
      type: "Official",
    });

    if (holidaysThisMonth.length === 0) {
      const reply =
        language === "ar"
          ? "لا توجد إجازات رسمية متبقية خلال هذا الشهر."
          : "There are no upcoming official holidays this month.";
      return res.json({ reply });
    }

    const reply =
      language === "ar"
        ? `:الإجازات الرسمية المتبقية خلال الشهر:\n${holidaysThisMonth
            .map((h) => {
              const dateObj = new Date(h.date);
              const formattedDate = dateObj.toLocaleDateString("ar-EG", {
                day: "numeric",
                month: "long",
                year: "numeric",
              });
              return `•  في تاريخ ${formattedDate}`;
            })
            .join("\n")}`
        : `The official holidays remaining this month:\n${holidaysThisMonth
            .map((h) => {
              const dateObj = new Date(h.date);
              const day = dateObj.getDate();
              const month = dateObj.toLocaleString("en-US", { month: "short" });
              const year = dateObj.getFullYear();
              return `• on ${day} ${month} ${year}`;
            })
            .join("\n")}`;

    return res.json({ reply });
  }

  // أقرب إجازة رسمية (عدد الأيام المتبقية)
  if (
    (language === "ar" && (msg.includes("اقرب اجازة") || msg.includes("كم يوم متبقي"))) ||
    (language === "en" &&
      (msg.includes("next holiday") ||
        msg.includes("official holiday") ||
        (msg.includes("how many days") && msg.includes("holiday"))))
  ) {
    const today = new Date();

    const futureHolidays = await Holiday.find({
      date: { $gte: today },
      isDeleted: false,
      type: "Official",
    });

    if (futureHolidays.length === 0) {
      const reply =
        language === "ar"
          ? "لا توجد إجازات رسمية متبقية لهذا العام."
          : "There are no official holidays left this year.";
      return res.json({ reply });
    }

    futureHolidays.sort((a, b) => new Date(a.date) - new Date(b.date));

    const nextHoliday = futureHolidays[0];
    const nextHolidayDate = new Date(nextHoliday.date);
    const daysLeft = getDaysDifference(today, nextHolidayDate);

    const reply =
      language === "ar"
        ? `${daysLeft} يوم${daysLeft > 1 ? "ًا" : ""}`
        : `${daysLeft} day${daysLeft > 1 ? "s" : ""}`;

    return res.json({ reply });
  }

  // رد افتراضي
  return res.json({
    reply:
      language === "ar"
        ? "لم أستطع فهم سؤالك. برجاء المحاولة بصيغة مختلفة."
        : "Sorry, I couldn't understand your question. Try rephrasing.",
  });
});
