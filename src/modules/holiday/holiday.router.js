import express from "express";

import { createHoliday } from "./controller/holiday.controller.js";

const router = express.Router();

router.post("/", createHoliday);

export default router;