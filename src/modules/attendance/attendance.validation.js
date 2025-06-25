import joi from "joi";

const timePattern = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/;

export const getAttendanceSchema = {
  query: joi.object({
    name: joi.string(),
    department: joi.string(),
    from: joi.date(),
    to: joi.date(),
    page: joi.number().integer().min(1).default(1).messages({
      "number.base": "Page must be a number",
      "number.integer": "Page must be an integer",
      "number.min": "Page must be at least 1",
    }),
    limit: joi.number().integer().min(1).default(10).messages({
      "number.base": "Limit must be a number",
      "number.integer": "Limit must be an integer",
      "number.min": "Limit must be at least 1",
    }),
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
      .allow("", null)
      .when("status", {
        is: "Present",
        then: joi.required().messages({
          "any.required": "Check-in time is required when status is Present",
          "string.pattern.base": "Check-in time must be in HH:MM 24-hour format",
        }),
        otherwise: joi.optional(),
      }),
    status: joi.string().valid("Present", "Absent").default("Present").required().messages({
      "any.only": "Status must be one of Present or Absent",
      "string.base": "Status must be a string",
    }),
  }),
};

export const createCheckOutSchema = {
  body: joi.object({
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
    status: joi.string().valid("Present", "Absent").default("Present").required().messages({
      "any.only": "Status must be one of Present or Absent",
      "string.base": "Status must be a string",
    }),
  }),
};

export const updateAttendanceSchema = {
  body: joi.object({
    checkInTime: joi.string().pattern(timePattern).messages({
      "string.pattern.base": "Check-in time must be in HH:MM 24-hour format",
    }),
    checkOutTime: joi.string().pattern(timePattern).allow("", null).optional().messages({
      "string.pattern.base": "Check-out time must be in HH:MM 24-hour format",
    }),
    status: joi.string().valid("Present", "Absent").default("Present").required().messages({
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
