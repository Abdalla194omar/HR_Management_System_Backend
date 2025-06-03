import express from "express";
import { createAttendance } from "./controller/attendance.controller.js";

export const router = express.Router();

router.post("/", createAttendance);
