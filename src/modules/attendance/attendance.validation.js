import joi from "joi";

export const createAttendanceSchema = joi.object({
  employee: joi.string().required().length(24).hex(),
  date: joi.date().required(),
  checkInTime: joi
    .string()
    .pattern(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/)
    .when("status", {
      is: "Present",
      then: joi.required(),
      otherwise: joi.optional(),
    }),
  checkOutTime: joi
    .string()
    .pattern(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/)
    .when("status", {
      is: "Present",
      then: joi.required(),
      otherwise: joi.optional(),
    }),
  lateDurationInHours: joi.number().min(0).max(24).default(0),
  overtimeDurationInHours: joi.number().min(0).max(24).default(0),
  status: joi
    .string()
    .valid("Present", "Absent", "On Leave")
    .default("Present"),
});
