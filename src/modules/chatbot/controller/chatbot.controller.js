import { getTodayAbsence } from "../../attendance/controller/attendance.controller.js";
import { getTotalEmployees } from "../../employee/controller/employee.controller.js";

export async function processChat(req, res) {
  const { message, language } = req.body;
  const lowerCaseMessage = message.toLowerCase();
  console.log(req.body);
  try {
    if (language === "ar") {
      if (lowerCaseMessage.includes("عدد الموظفين")) {
        const total = await getTotalEmployees();
        return res.json({ response: `عدد الموظفين: ${total}` });
      } else if (lowerCaseMessage.includes("حضور اليوم")) {
        const absence = await getTodayAbsence();
        return res.json({
          response: `الغياب اليوم: ${absence.absenceCount || 0} موظف`,
        });
      } else {
        return res.json({ response: "عذرًا، لم أفهم طلبك." });
      }
    } else {
      if (lowerCaseMessage.includes("employee count")) {
        const total = await getTotalEmployees();
        return res.json({ response: `Total employees: ${total}` });
      } else if (lowerCaseMessage.includes("today’s attendance")) {
        const absence = await getTodayAbsence();
        return res.json({
          response: `Today's absences: ${absence.absenceCount || 0} employees`,
        });
      } else {
        return res.json({
          response: "Sorry, I didn’t understand your request.",
        });
      }
    }
  } catch (error) {
    console.error("Chatbot error:", error);
    res
      .status(500)
      .json({ error: language === "ar" ? "حدث خطأ" : "An error occurred" });
  }
}
