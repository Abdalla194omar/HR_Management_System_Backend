import { Router } from "express";
import * as holidayController from "./controller/holiday.controller.js";
import { validateCreateHoliday, validateUpdateHoliday, validateDeleteHoliday, validateGetHolidays } from "./holiday.validation.js";

const router = Router();

router.route("/")
  .get(validateGetHolidays, holidayController.getHolidays)
  .post(validateCreateHoliday, holidayController.createHoliday);

router.route("/:id")
  .put(validateUpdateHoliday, holidayController.updateHoliday)
  .delete(validateDeleteHoliday, holidayController.deleteHoliday);

export default router;