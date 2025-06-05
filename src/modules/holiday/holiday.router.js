import express from "express";

import { createHoliday } from "./controller/holiday.controller.js";
import validation from "../../middleWare/validation.js";
import { createHolidaySchema } from "./holiday.validation.js";

const router = express.Router();

router.post("/", validation(createHolidaySchema), createHoliday);

export default router;
