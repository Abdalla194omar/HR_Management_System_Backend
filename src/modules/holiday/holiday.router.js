import express from "express";
import { validateHoliday } from "./holiday.validation.js";
import { createHoliday } from "./controller/holiday.controller.js";

const router = express.Router();

router.post("/", validateHoliday, createHoliday);

export default router;