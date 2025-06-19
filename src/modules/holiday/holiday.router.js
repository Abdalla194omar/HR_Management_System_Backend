import express from "express";

import { validateHoliday } from './holiday.validation.js';

import { createHoliday, getHolidays, updateHoliday, deleteHoliday } from "./controller/holiday.controller.js";
const router = express.Router();

router.post("/", validateHoliday, createHoliday);
router.get("/", getHolidays);
router.put("/:id", validateHoliday, updateHoliday);
router.delete("/:id", deleteHoliday);

export default router;