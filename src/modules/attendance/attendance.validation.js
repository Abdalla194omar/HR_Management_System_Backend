import joi from "joi";

const timePattern = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/;

export const getAttendanceSchema = {
  query: joi.object({
    name: joi.string(),
    department: joi.string(),
    from: joi.date(),
    to: joi.date(),
  }),
};

export const createCheckIneSchema = {
  body: joi.object({
    employee: joi.string().required().length(24).hex().messages({
      "string.base": "Employee ID must be a string",
      "string.length": "Employee ID must be exactly 24 characters long",
      "string.hex": "Employee ID must be a valid hexadecimal string",
      "any.required": "Employee ID is required",
    }),
    date: joi.date().required().messages({
      "date.base": "Date must be a valid date",
      "any.required": "Date is required",
    }),
    checkInTime: joi
      .string()
      .pattern(timePattern)
      .when("status", {
        is: "Present",
        then: joi.required(),
        otherwise: joi.optional(),
      })
      .messages({
        "string.pattern.base": "Check-in time must be in HH:MM 24-hour format",
        "any.required": "Check-in time is required when status is Present",
      }),
    status: joi
      .string()
      .valid("Present", "Absent")
      .default("Present")
      .messages({
        "any.only": "Status must be one of Present or Absent",
        "string.base": "Status must be a string",
      }),
  }),
};

export const createCheckOutSchema = {
  body: joi.object({
    employee: joi.string().required().length(24).hex().messages({
      "string.base": "Employee ID must be a string",
      "string.length": "Employee ID must be exactly 24 characters long",
      "string.hex": "Employee ID must be a valid hexadecimal string",
      "any.required": "Employee ID is required",
    }),
    date: joi.date().required().messages({
      "date.base": "Date must be a valid date",
      "any.required": "Date is required",
    }),
    checkOutTime: joi.string().pattern(timePattern).required().messages({
      "string.pattern.base": "Check-out time must be in HH:MM 24-hour format",
      "any.required": "Check-out time is required",
    }),
  }),
};

export const createAttendanceSchema = {
  body: joi.object({
    employee: joi.string().required().length(24).hex().messages({
      "string.base": "Employee ID must be a string",
      "string.length": "Employee ID must be exactly 24 characters long",
      "string.hex": "Employee ID must be a valid hexadecimal string",
      "any.required": "Employee ID is required",
    }),
    date: joi.date().required().messages({
      "date.base": "Date must be a valid date",
      "any.required": "Date is required",
    }),
    checkInTime: joi
      .string()
      .pattern(timePattern)
      .when("status", {
        is: "Present",
        then: joi.required(),
        otherwise: joi.optional(),
      })
      .messages({
        "string.pattern.base": "Check-in time must be in HH:MM 24-hour format",
        "any.required": "Check-in time is required when status is Present",
      }),
    checkOutTime: joi
      .string()
      .pattern(timePattern)
      .when("status", {
        is: "Present",
        then: joi.required(),
        otherwise: joi.optional(),
      })
      .messages({
        "string.pattern.base": "Check-out time must be in HH:MM 24-hour format",
        "any.required": "Check-out time is required when status is Present",
      }),
    status: joi
      .string()
      .valid("Present", "Absent")
      .default("Present")
      .messages({
        "any.only": "Status must be one of Present or Absent",
        "string.base": "Status must be a string",
      }),
  }),
};

export const updateAttendanceSchema = {
  body: joi.object({
    date: joi.date().messages({
      "date.base": "Date must be a valid date",
    }),
    checkInTime: joi.string().pattern(timePattern).messages({
      "string.pattern.base": "Check-in time must be in HH:MM 24-hour format",
    }),
    checkOutTime: joi.string().pattern(timePattern).allow("").messages({
      "string.pattern.base": "Check-out time must be in HH:MM 24-hour format",
    }),
    status: joi
      .string()
      .valid("Present", "Absent")
      .default("Present")
      .messages({
        "any.only": "Status must be one of Present or Absent",
        "string.base": "Status must be a string",
      }),
  }),
  params: joi.object({
    id: joi.string().alphanum().length(24).required().messages({
      "string.base": "ID must be a string",
      "string.alphanum": "ID must be alphanumeric",
      "string.length": "ID must be exactly 24 characters",
      "any.required": "ID is required",
    }),
  }),
};

export const deleteAttendanceSchema = {
  params: joi.object({
    id: joi.string().alphanum().length(24).required().messages({
      "string.base": "ID must be a string",
      "string.alphanum": "ID must be alphanumeric",
      "string.length": "ID must be exactly 24 characters",
      "any.required": "ID is required",
    }),
  }),
};
