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

// عدد الموظفين في قسم معين 
if (
  (language === "ar" && msg === "عدد موظفين قسم معين؟") ||
  (language === "en" && msg === "Employees in a Department?")
) {
  return res.json({
    reply: language === "ar" ? "اسم القسم ايه؟" : "What is the department name?",
  });
}

// لو المستخدم كتب اسم القسم مباشرة بعد السؤال
const possibleDepartment = await Department.findOne({
  departmentName: { $regex: new RegExp(msg, "i") },
  isDeleted: false,
});

if (possibleDepartment) {
  const employeeCount = await Employee.countDocuments({
    department: possibleDepartment._id,
    isDeleted: false,
  });

  return res.json({
    reply:
      language === "ar"
        ? `عدد الموظفين في قسم ${possibleDepartment.departmentName} هو: ${employeeCount}`
        : `There are ${employeeCount} employees in ${possibleDepartment.departmentName} department.`,
  });
}

// عدد الأقسام اللي فيها أكتر من 5 موظفين
if (
  (language === "ar" && msg.includes("قسم فيه أكتر من 5 موظفين")) ||
  (language === "en" && msg.includes("departments have more than 5 employees"))
) {
  const departments = await Department.find({ isDeleted: false });

  let count = 0;

  for (const dep of departments) {
    const empCount = await Employee.countDocuments({
      department: dep._id,
      isDeleted: false,
    });

    if (empCount > 5) count++;
  }

  return res.json({
    reply:
      language === "ar"
        ? `عدد الأقسام اللي فيها أكتر من 5 موظفين هو: ${count}`
        : `Number of departments with more than 5 employees: ${count}`,
  });
}

// الأقسام اللي مفيهاش موظفين
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
        ? `الأقسام اللي مفيهاش موظفين:\n${emptyDepartments.map((d) => `• ${d}`).join("\n")}`
        : `Departments without employees:\n${emptyDepartments.map((d) => `• ${d}`).join("\n")}`,
  });
}

// مين آخر موظف انضم؟

if (
  (language === "ar" && msg === "مين آخر موظف انضم؟") ||
  (language === "en" && msg === "Who is the most recently added employee?")
) {
  const lastEmployee = await Employee.findOne({ isDeleted: false }).sort({ createdAt: -1 });

  if (!lastEmployee) {
    return res.json({
      reply: language === "ar" ? "لا يوجد موظفين حاليًا." : "There are no employees currently.",
    });
  }

  return res.json({
    reply:
      language === "ar"
        ? `آخر موظف انضم هو: ${lastEmployee.firstName} ${lastEmployee.lastName}`
        : `The most recently added employee is: ${lastEmployee.firstName} ${lastEmployee.lastName}`,
  });
}


//عدد الموظفين الجدد هذا الشهر

if (
  (language === "ar" && msg === "كام موظف انضم هذا الشهر؟") ||
  (language === "en" && msg === "How many employees joined this month?")
) {
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);

  const newEmployees = await Employee.countDocuments({
    isDeleted: false,
    createdAt: { $gte: startOfMonth, $lte: endOfMonth },
  });

  return res.json({
    reply:
      language === "ar"
        ? `عدد الموظفين اللي انضموا هذا الشهر هو: ${newEmployees}`
        : `Number of employees joined this month: ${newEmployees}`,
  });
}

//مين عنده إجازة دلوقتي؟

if (
  (language === "ar" && msg.includes("إجازة دلوقتي")) ||
  (language === "en" && msg.includes("currently on leave"))
) {
  const todayDate = new Date();
  const todayUtcDate = new Date(Date.UTC(todayDate.getUTCFullYear(), todayDate.getUTCMonth(), todayDate.getUTCDate()));
  const tomorrowUtcDate = new Date(todayUtcDate);
  tomorrowUtcDate.setUTCDate(tomorrowUtcDate.getUTCDate() + 1);

  const onLeave = await Attendance.find({
    status: "Leave",
    date: { $gte: todayUtcDate, $lt: tomorrowUtcDate },
  }).populate({
    path: "employee",
    select: "firstName lastName",
  });

  if (onLeave.length === 0) {
    return res.json({
      reply: language === "ar" ? "مفيش حد في إجازة دلوقتي." : "No one is currently on leave.",
    });
  }

  const names = onLeave.map((e) => `${e.employee.firstName} ${e.employee.lastName}`).join("-");

  return res.json({
    reply: language === "ar" ? `الموظفين اللي في إجازة:\n${names}` : `Employees currently on leave:\n${names}`,
  });
}


  //  رد افتراضي
  return res.json({
    reply: language === "ar" ? "لم أستطع فهم سؤالك. برجاء المحاولة بصيغة مختلفة." : "Sorry, I couldn't understand your question. Try rephrasing.",
  });
});
