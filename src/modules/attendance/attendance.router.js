import express from "express";
import { getAttendance, createAttendance, updateAttendance, deleteAttendance } from "./controller/attendance.controller.js";
import validation from "../../middleWare/validation.js";
import { getAttendanceSchema, createAttendanceSchema, updateAttendanceSchema, deleteAttendanceSchema } from "./attendance.validation.js";

export const router = express.Router();

// adding validation schema in route
router.get("/", getAttendance);
router.post("/", validation(createAttendanceSchema), createAttendance);
router.patch("/:id", validation(updateAttendanceSchema), updateAttendance);
router.delete("/:id", validation(deleteAttendanceSchema), deleteAttendance);
