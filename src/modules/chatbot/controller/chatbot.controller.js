import asyncHandler from "../../../utils/asyncHandeler.js";
import { getTodayAbsence } from "../../attendance/controller/attendance.controller.js";
import { getTotalEmployees } from "../../employee/controller/employee.controller.js";

const responses = {
  ar: [
    {
      keywords: ["مرتب", "المرتب", "الراتب"],
      reply: "تقدر تشوف المرتب من صفحة 'تقرير المرتبات'.",
    },
    {
      keywords: ["غياب", "حاضر", "حضور"],
      reply: "معلومات الحضور والغياب متوفرة في صفحة 'الحضور'.",
    },
    {
      keywords: ["موظف", "الموظفين"],
      reply:
        "تقدر تدير الموظفين من صفحة 'الموظفين' وتشوف كل البيانات الخاصة بيهم.",
    },
    {
      keywords: ["قسم", "الاقسام"],
      reply: "لإدارة الأقسام، توجه لصفحة 'الأقسام'.",
    },
    {
      keywords: ["اجازة", "الإجازات", "عطلة"],
      reply: "ممكن تشوف الإجازات الرسمية من صفحة 'الإجازات الرسمية'.",
    },
    {
      keywords: ["اضيف موظف"],
      reply: "تقدر تضيف موظف جديد من زر 'إضافة موظف' في صفحة الموظفين.",
    },
    {
      keywords: ["عدد", "كام موظف"],
      reply: "تقدر تعرف إجمالي عدد الموظفين من صفحة 'الموظفين'.",
    },
    {
      keywords: ["اسم", "ابحث"],
      reply: "في صفحة الموظفين تقدر تبحث بالاسم أو البريد الإلكتروني.",
    },
    {
      keywords: ["تسجيل", "دخول"],
      reply: "لو مش مسجل الدخول، هيتم توجيهك تلقائيًا لصفحة تسجيل الدخول.",
    },
  ],
  en: [
    {
      keywords: ["salary", "salaries"],
      reply: "You can check the salary reports in the 'Salaries Report' page.",
    },
    {
      keywords: ["attendance", "absent", "present"],
      reply: "Attendance data is available in the 'Attendance' page.",
    },
    {
      keywords: ["employee", "employees"],
      reply: "You can manage employees from the 'Employees' section.",
    },
    {
      keywords: ["department"],
      reply: "Departments can be managed from the 'Departments' page.",
    },
    {
      keywords: ["holiday", "vacation"],
      reply: "You can check official holidays in the 'Official Holidays' page.",
    },
    {
      keywords: ["add employee"],
      reply: "To add an employee, go to the 'Add Employee' page.",
    },
    {
      keywords: ["how many", "total"],
      reply: "You can find total employee count in the 'Employees' page.",
    },
    {
      keywords: ["search", "find"],
      reply: "You can use the search feature in the 'Employees' section.",
    },
    {
      keywords: ["login"],
      reply:
        "If you’re not logged in, the system will redirect you to the login page.",
    },
  ],
};

export const processChat = asyncHandler(async (req, res) => {
  console.log(req.body);
  const { message, language } = req.body;
  const lang = language === "ar" ? "ar" : "en";
  const userInput = message.toLowerCase();

  const matched = responses[lang].find((item) =>
    item.keywords.some((kw) => userInput.includes(kw))
  );

  res.json({
    reply: matched
      ? matched.reply
      : lang === "ar"
      ? "عذرًا، مش فاهم سؤالك. جرب كلمات تانية."
      : "Sorry, I didn't understand that. Try asking differently.",
  });
});
