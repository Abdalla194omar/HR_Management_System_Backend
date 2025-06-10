import express from "express";
import * as controllers from "./controller/attendance.controller.js";
import validation from "../../middleWare/validation.js";
import * as schemas from "./attendance.validation.js";
import { getAttendanceV2 } from "./getAttendance.js";

export const router = express.Router();

router.get("/", validation(schemas.getAttendanceSchema), controllers.getAttendance);

// router.get("/", validation(schemas.getAttendanceSchema), getAttendanceV2);

router.post("/", validation(schemas.createAttendanceSchema), controllers.createAttendance);

router.post("/checkin", validation(schemas.createCheckIneSchema), controllers.createCheckIn);

router.patch("/checkout/:id", validation(schemas.createCheckOutSchema), controllers.createCheckOut);

router.patch("/:id", validation(schemas.updateAttendanceSchema), controllers.updateAttendance);

router.delete("/:id", validation(schemas.deleteAttendanceSchema), controllers.deleteAttendance);
