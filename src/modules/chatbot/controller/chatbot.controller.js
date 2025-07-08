import Employee from "../../../../DB/model/Employee.js";
import asyncHandler from "../../../utils/asyncHandeler.js";
import Attendance from "../../../../DB/model/Attendence.js";
import Department from "../../../../DB/model/Department.js";

export const processChat = asyncHandler(async (req, res) => {
  const { message, language } = req.body;
  const msg = message.toLowerCase().trim();

  // عدد الموظفين
  if ((language === "ar" && msg.includes("عدد الموظفين")) || (language === "en" && msg.includes("how many employees"))) {
    const totalEmployees = await Employee.countDocuments({ isDeleted: false });
    const reply = language === "ar" ? `عدد الموظفين الحالي هو: ${totalEmployees}` : `Current number of employees is: ${totalEmployees}`;
    return res.json({ reply });
  }

  // عدد الأقسام
  if ((language === "ar" && msg.includes("عدد الأقسام")) || (language === "en" && msg.includes("how many departments"))) {
    const totalDepartments = await Department.countDocuments({ isDeleted: false });
    const reply = language === "ar" ? `عدد الأقسام الحالية هو: ${totalDepartments}` : `Current number of departments is: ${totalDepartments}`;
    return res.json({ reply });
  }

  // الأقسام الموجودة في الشركة
  if ((language === "ar" && msg.includes("الأقسام في الشركة")) || (language === "en" && msg.includes("departments in the company"))) {
    const departments = await Department.find({ isDeleted: false });
    const reply =
      language === "ar"
        ? `الأقسام الموجودة في الشركة هي:\n${departments.map((depart) => `• ${depart.departmentName}`).join("\n")}`
        : `The departments in the company are:\n${departments.map((depart) => `• ${depart.departmentName}`).join("\n")}`;
    return res.json({ reply });
  }

  // الغياب اليومي
  if ((language === "ar" && msg.includes("غياب النهارده")) || (language === "en" && msg.includes("absent today"))) {
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

    const names = absentList.map((a) => `${a.employee.firstName} ${a.employee.lastName}`).join("-");

    return res.json({
      reply: language === "ar" ? `الموظفين الغايبين:\n${names}` : `Absent employees:\n${names}`,
    });
  }

  //  رد افتراضي
  return res.json({
    reply: language === "ar" ? "لم أستطع فهم سؤالك. برجاء المحاولة بصيغة مختلفة." : "Sorry, I couldn't understand your question. Try rephrasing.",
  });
});
