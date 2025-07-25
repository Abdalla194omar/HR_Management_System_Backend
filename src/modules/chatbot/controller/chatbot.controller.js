import Employee from "../../../../DB/model/Employee.js";
import asyncHandler from "../../../utils/asyncHandeler.js";
import Attendance from "../../../../DB/model/Attendence.js";
import Department from "../../../../DB/model/Department.js";
import {
  attendanceReportFunc,
  lateEmployeesFunc,
  topEmployeesFunc,
} from "../../../utils/ChatbotAttendance.js";
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

const getDaysDifference = (date1, date2) => {
  const diffTime = date2.getTime() - date1.getTime();
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
};

export const processChat = asyncHandler(async (req, res) => {
  const { message, language } = req.body;
  const msg = message.toLowerCase().trim();

  // Reset state if a new non-followup command is detected
  if (
    msg.includes("اعرف") ||
    msg.includes("get") ||
    msg.includes("كم") ||
    msg.includes("عدد") ||
    msg.includes("تقرير") ||
    msg.includes("غياب") ||
    msg.includes("غايب") ||
    msg.includes("غائب") ||
    msg.includes("absent") ||
    msg.includes("absence") ||
    msg.includes("انضم") ||
    msg.includes("الأقسام") ||
    msg.includes("قسم") ||
    msg.includes("موظفين") ||
    msg.includes("موظف") ||
    msg.includes("departments") ||
    msg.includes("department") ||
    msg.includes("employees") ||
    msg.includes("employee") ||
    msg.includes("holidays") ||
    msg.includes("holiday") ||
    msg.includes("اجازة") ||
    msg.includes("إجازة") ||
    msg.includes("إجازات") ||
    msg.includes("اجازات") ||
    msg.includes("top") ||
    msg.includes("المميز") ||
    msg.includes("الموظف المميز")
  ) {
    hrChatState = {};
  }

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

  // // عدد الأقسام
  // if (
  //   (language === "ar" && msg.includes("عدد الأقسام")) ||
  //   (language === "en" && msg.includes("how many departments"))
  // ) {
  //   const totalDepartments = await Department.countDocuments({
  //     isDeleted: false,
  //   });
  //   const reply =
  //     language === "ar"
  //       ? `عدد الأقسام الحالية هو: ${totalDepartments}`
  //       : `Current number of departments is: ${totalDepartments}`;
  //   return res.json({ reply });
  // }

  // new: عدد و اسماء الأقسام اللي فيها أكتر من 5 موظفين -
  if (
    (language === "ar" &&
      (msg.includes("أقسام فيها أكتر من 5 موظفين") ||
        msg.includes("قسم فيه أكتر من 5 موظفين"))) ||
    (language === "en" &&
      msg.includes("departments with more than 5 employees"))
  ) {
    const departments = await Department.find({ isDeleted: false });

    let count = 0;
    let departmentNames = [];

    for (const dep of departments) {
      const empCount = await Employee.countDocuments({
        department: dep._id,
        isDeleted: false,
      });

      if (empCount > 5) {
        count++;
        departmentNames.push(dep.departmentName);
      }
    }

    const namesList = departmentNames.map((name) => `• ${name}`).join("\n");

    return res.json({
      reply:
        language === "ar"
          ? count === 0
            ? "لا يوجد أي قسم فيه أكثر من 5 موظفين."
            : `📊 عدد الأقسام اللي فيها أكتر من 5 موظفين هو: ${count}\n\n${namesList}`
          : count === 0
          ? "There are no departments with more than 5 employees."
          : `📊 Number of departments with more than 5 employees: ${count}\n\n${namesList}`,
    });
  }

  // edit: عدد الأقسام فقط (شرط دقيق لتجنب التداخل)
  if (
    (language === "ar" && msg.trim().includes("عدد الأقسام")) ||
    (language === "en" && msg.trim().includes("how many departments")) ||
    (language === "en" && msg.trim().includes("number of departments"))
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

  // الموظف المميز لهذا الشهر
  if (
    (language === "ar" && msg.includes("الموظفين المميزين")) ||
    (language === "en" && msg.includes("top employees"))
  ) {
    const reply = await topEmployeesFunc(language);
    return res.json(reply);
  }

  // الموظفين المتجاوزين لساعات التأخير المسموحة في الشهر
  if (
    (language === "ar" && msg.includes("الموظفين المتجاوزين")) ||
    (language === "en" &&
      msg.includes("employees exceeded the allowed lateness"))
  ) {
    const reply = await lateEmployeesFunc(language);
    return res.json(reply);
  }

  // تقرير الحضور لهذا الشهر
  if (
    (language === "ar" && msg.includes("تقرير الحضور والغياب")) ||
    (language === "en" && msg.includes("attendance report"))
  ) {
    const reply = await attendanceReportFunc(language);
    return res.json(reply);
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

  //new: عدد الموظفين في قسم معين
  if (
    (language === "ar" && msg.includes("قسم معين")) ||
    (language === "en" && msg.includes("employees in a department"))
  ) {
    hrChatState = { waitingFor: "departmentEmployeeCount" };
    return res.json({
      reply:
        language === "ar" ? "اسم القسم ايه؟" : "What is the department name?",
    });
  }

  // المستخدم كتب اسم القسم بعد السؤال
  if (hrChatState.waitingFor === "departmentEmployeeCount") {
    const deptName = message.trim(); // مفيش msg هنا لأنه ممكن تكون كابيتال أو فيها علامات

    const possibleDepartment = await Department.findOne({
      departmentName: { $regex: new RegExp(`^${deptName}$`, "i") },
      isDeleted: false,
    });

    if (!possibleDepartment) {
      return res.json({
        reply:
          language === "ar"
            ? `❌ القسم "${deptName}" غير موجود. حاول تكتب الاسم صح.`
            : `❌ Department "${deptName}" not found. Please check the name and try again.`,
      });
    }

    hrChatState = {};

    const employeeCount = await Employee.countDocuments({
      department: possibleDepartment._id,
      isDeleted: false,
    });

    return res.json({
      reply:
        language === "ar"
          ? `📊 عدد الموظفين في قسم ${possibleDepartment.departmentName}: ${employeeCount}`
          : `📊 There are ${employeeCount} employees in the ${possibleDepartment.departmentName} department.`,
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
          : `${
              employee.firstName
            } was hired on ${employee.hireDate.toDateString()}`,
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

  // الإجازات المتبقية خلال هذا الشهر فقط
  if (
    (language === "ar" &&
      (msg.includes("الإجازات") ||
        msg.includes("اجازات") ||
        msg.includes("إجازات")) &&
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
    });

    if (holidaysThisMonth.length === 0) {
      const reply =
        language === "ar"
          ? "لا توجد إجازات متبقية خلال هذا الشهر."
          : "There are no upcoming holidays this month.";
      return res.json({ reply });
    }

    const reply =
      language === "ar"
        ? `:الإجازات المتبقية خلال الشهر:\n${holidaysThisMonth
            .map((h) => {
              const dateObj = new Date(h.date);
              const formattedDate = dateObj.toLocaleDateString("ar-EG", {
                day: "numeric",
                month: "long",
                year: "numeric",
              });
              return ` في تاريخ ${formattedDate}`;
            })
            .join("\n")}`
        : `The holidays remaining this month:\n${holidaysThisMonth
            .map((h) => {
              const dateObj = new Date(h.date);
              const day = dateObj.getDate();
              const month = dateObj.toLocaleString("en-US", { month: "short" });
              const year = dateObj.getFullYear();
              return ` on ${day} ${month} ${year}`;
            })
            .join("\n")}`;

    return res.json({ reply });
  }

  // أقرب إجازة رسمية (عدد الأيام المتبقية)
  if (
    (language === "ar" &&
      (msg.includes("اقرب اجازة") || msg.includes("كم يوم متبقي"))) ||
    (language === "en" &&
      (msg.includes("next holiday") ||
        msg.includes("official holiday") ||
        (msg.includes("how many days") && msg.includes("holiday"))))
  ) {
    const today = new Date();

    const futureHolidays = await Holiday.find({
      date: { $gte: today },
      isDeleted: false,
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

  //new:  الأقسام اللي مفيهاش موظفين
  if (
    (language === "ar" && msg.includes("أقسام بدون موظفين")) ||
    (language === "en" && msg.includes("departments without employees"))
  ) {
    const departments = await Department.find({ isDeleted: false });

    let emptyDepartments = [];

    for (const dep of departments) {
      const empCount = await Employee.countDocuments({
        department: dep._id,
        isDeleted: false,
      });

      if (empCount === 0) {
        emptyDepartments.push(dep.departmentName);
      }
    }

    if (emptyDepartments.length === 0) {
      return res.json({
        reply:
          language === "ar"
            ? "كل الأقسام فيها موظفين."
            : "All departments have employees.",
      });
    }

    return res.json({
      reply:
        language === "ar"
          ? `الأقسام اللي مفيهاش موظفين:\n${emptyDepartments
              .map((d) => `• ${d}`)
              .join("\n")}`
          : `Departments without employees:\n${emptyDepartments
              .map((d) => `• ${d}`)
              .join("\n")}`,
    });
  }

  // should checked using hire date not created at
  //new: مين آخر موظف انضم؟
  if (
    (language === "ar" && msg.includes("آخر موظف انضم")) ||
    (language === "en" && msg.includes("most recently added employee"))
  ) {
    const lastEmployee = await Employee.findOne({ isDeleted: false }).sort({
      hireDate: -1,
    });

    if (!lastEmployee) {
      return res.json({
        reply:
          language === "ar"
            ? "لا يوجد موظفين حاليًا."
            : "There are no employees currently.",
      });
    }

    return res.json({
      reply:
        language === "ar"
          ? `آخر موظف انضم هو: ${lastEmployee.firstName} ${lastEmployee.lastName}`
          : `The most recently added employee is: ${lastEmployee.firstName} ${lastEmployee.lastName}`,
    });
  }

  //  new: عدد الموظفين الجدد هذا الشهر
  if (
    (language === "ar" && msg.includes("انضم هذا الشهر")) ||
    (language === "en" && msg.includes("joined this month"))
  ) {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(
      now.getFullYear(),
      now.getMonth() + 1,
      0,
      23,
      59,
      59
    );

    const newEmployees = await Employee.countDocuments({
      hireDate: { $gte: startOfMonth, $lte: endOfMonth },
    });

    return res.json({
      reply:
        language === "ar"
          ? `عدد الموظفين اللي انضموا هذا الشهر هو: ${newEmployees}`
          : `Number of employees joined this month: ${newEmployees}`,
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

  // رد افتراضي
  return res.json({
    reply:
      language === "ar"
        ? "لم أستطع فهم سؤالك. برجاء المحاولة بصيغة مختلفة."
        : "Sorry, I couldn't understand your question. Try rephrasing.",
  });
});
