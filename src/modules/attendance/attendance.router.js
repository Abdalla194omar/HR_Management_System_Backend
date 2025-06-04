import express from "express";
import { createAttendance } from "./controller/attendance.controller.js";
import validation from "../../middleWare/validation.js";
import { createAttendanceSchema } from "./attendance.validation.js";

export const router = express.Router();

// adding validation schema in route
// router.post("/", createAttendance);
router.post("/", validation({body: createAttendanceSchema}), createAttendance);
