<<<<<<< Updated upstream
import express from "express";

import { validateHoliday } from './holiday.validation.js';

import { createHoliday, getHolidays, updateHoliday, deleteHoliday } from "./controller/holiday.controller.js";
const router = express.Router();

router.post("/", validateHoliday, createHoliday);
router.get("/", getHolidays);
router.put("/:id", validateHoliday, updateHoliday);
router.delete("/:id", deleteHoliday);

=======
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

>>>>>>> Stashed changes
export default router;