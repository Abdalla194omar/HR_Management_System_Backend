import express from "express";
import * as controllers from "./controller/attendance.controller.js";
import validation from "../../middleWare/validation.js";
import * as schemas from "./attendance.validation.js";

export const router = express.Router();

router
  .route("/")
  .get(validation(schemas.getAttendanceSchema), controllers.getAttendance)
  .post(validation(schemas.createAttendanceSchema), controllers.createAttendance);

router
  .route("/:id")
  .patch(validation(schemas.updateAttendanceSchema), controllers.updateAttendance)
  .delete(validation(schemas.deleteAttendanceSchema), controllers.deleteAttendance);

router.post("/checkin", validation(schemas.createCheckIneSchema), controllers.createCheckIn);

router.get("/absence", controllers.getTodayAbsence);

router.get("/graph", controllers.getAttendanceGraph);

router.patch("/checkout/:id", validation(schemas.createCheckOutSchema), controllers.createCheckOut);
