import Employee from "../../../../DB/model/Employee.js";
import asyncHandler from "../../../utils/asyncHandeler.js";
import Attendance from "../../../../DB/model/Attendence.js";
import Department from "../../../../DB/model/Department.js";
let hrChatState = {};


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


  
  // Get employee department
if (hrChatState.waitingFor === "departmentName") {
const name = message.trim().replace(/\s+/g, " ");
const [firstName, lastName] = name.split(" ");


    if (!firstName || !lastName) {
      return res.json({
        reply:
          language === "ar"
            ? "من فضلك اكتب الاسم الأول والاسم الأخير معًا."
            : "Please enter both first name and last name.",
      });
    }

    const employee = await Employee.findOne({
      firstName: new RegExp(`^${firstName}$`, "i"),
      lastName: new RegExp(`^${lastName}$`, "i"),
      isDeleted: false,
    }).populate("department");

    if (!employee) {
      return res.json({
        reply:
          language === "ar"
            ? "لا يوجد موظف بهذا الاسم. حاول تكتب الاسم مرة تانية."
            : "Employee not found. Please try entering the name again.",
      });
    }

    hrChatState = {}; 

    const dept = employee.department?.departmentName;

    return res.json({
      reply:
        language === "ar"
          ? dept
            ? `شغال في قسم ${employee.firstName} ${employee.lastName}  الموظف  ${dept}`
            : "الموظف غير مسجل في أي قسم."
          : dept
          ? `${employee.firstName} ${employee.lastName} works in ${dept} department`
          : "Employee is not assigned to any department.",
    });
  }

  // Get employee hire date
if (hrChatState.waitingFor === "hireDate") {
const name = message.trim().replace(/\s+/g, " ");
const [firstName, lastName] = name.split(" ");


    if (!firstName || !lastName) {
      return res.json({
        reply:
          language === "ar"
            ? "من فضلك اكتب الاسم الأول والاسم الأخير معًا."
            : "Please enter both first name and last name.",
      });
    }

    const employee = await Employee.findOne({
      firstName: new RegExp(`^${firstName}$`, "i"),
      lastName: new RegExp(`^${lastName}$`, "i"),
      isDeleted: false,
    });

    if (!employee) {
      return res.json({
        reply:
          language === "ar"
            ? "لا يوجد موظف بهذا الاسم. حاول تكتب الاسم مرة تانية."
            : "Employee not found. Please try entering the name again.",
      });
    }

    hrChatState = {}; 

    const dateStr = employee.hireDate.toLocaleDateString("ar-EG");

    return res.json({
      reply:
        language === "ar"
          ? `${employee.firstName}  ${dateStr} اتعين يوم`
          : `${employee.firstName} was hired on ${employee.hireDate.toDateString()}`,
    });
  }

  if (
    (language === "ar" && msg === "اعرف قسم موظف") ||
    (language === "en" && msg === "get employee department")
  ) {
    hrChatState = { waitingFor: "departmentName" };
    return res.json({
      reply:
        language === "ar"
          ? "من فضلك اكتب اسم الموظف (بالإنجليزي)"
          : "Please enter the employee name (in English)",
    });
  }

  if (
    (language === "ar" && msg === "اعرف تاريخ تعيين موظف") ||
    (language === "en" && msg === "get employee hire date")
  ) {
    hrChatState = { waitingFor: "hireDate" };
    return res.json({
      reply:
        language === "ar"
          ? "من فضلك اكتب اسم الموظف (بالإنجليزي)"
          : "Please enter the employee name (in English)",
    });
  }

  // If waiting for input but got something irrelevant
  if (hrChatState.waitingFor) {
    return res.json({
      reply:
        language === "ar"
          ? "من فضلك اكتب اسم الموظف (بالإنجليزي)."
          : "Please enter the employee name (in English).",
    });
  }



  //  رد افتراضي
  return res.json({
    reply: language === "ar" ? "لم أستطع فهم سؤالك. برجاء المحاولة بصيغة مختلفة." : "Sorry, I couldn't understand your question. Try rephrasing.",
  });
});
