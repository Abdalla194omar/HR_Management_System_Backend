import Joi from "joi";
import validation from "../../middleWare/validation.js";


const createHolidaySchema = {
  body: Joi.object({
    name: Joi.string()
      .min(2)
      .max(100)
      .trim()
      .required()
      .messages({
        "string.min": "Holiday name must be at least 2 characters",
        "string.max": "Holiday name must be at most 100 characters",
        "any.required": "Holiday name is required",
      }),
    date: Joi.date()
      .min('now')
      .iso()
      .required()
      .messages({
        "date.base": "Invalid date format",
        "date.min": "Holiday date cannot be in the past",
        "date.isoDate": "Date must be in ISO format",
        "any.required": "Date is required",
      }),
    type: Joi.string()
      .valid("Official", "Custom")
      .required()
      .messages({
        "any.only": "Type must be either 'Official' or 'Custom'",
        "any.required": "Type is required",
      }),
  }).min(1),
};

const updateHolidaySchema = {
  params: Joi.object({
    id: Joi.string()
      .required()
      .hex()
      .length(24)
      .messages({
        "any.required": "Holiday ID is required",
        "string.hex": "Invalid ID format",
        "string.length": "ID must be 24 characters long",
      }),
  }),
  body: Joi.object({
    name: Joi.string()
      .min(2)
      .max(100)
      .trim()
      .optional()
      .messages({
        "string.min": "Holiday name must be at least 2 characters",
        "string.max": "Holiday name must be at most 100 characters",
      }),
    date: Joi.date()
      .min('now')
      .iso()
      .optional()
      .messages({
        "date.base": "Invalid date format",
        "date.min": "Holiday date cannot be in the past",
        "date.isoDate": "Date must be in ISO format",
      }),
    type: Joi.string()
      .valid("Official", "Custom")
      .optional()
      .messages({
        "any.only": "Type must be either 'Official' or 'Custom'",
      }),
  }).min(1), 
};


const deleteHolidaySchema = {
  params: Joi.object({
    id: Joi.string()
      .required()
      .hex()
      .length(24)
      .messages({
        "any.required": "Holiday ID is required",
        "string.hex": "Invalid ID format",
        "string.length": "ID must be 24 characters long",
      }),
  }),
};


const getHolidaysSchema = {
  query: Joi.object({
    type: Joi.string()
      .valid("Official", "Custom")
      .messages({
        "any.only": "Type must be either 'Official' or 'Custom'",
      }),
    date: Joi.date()
      .iso()
      .messages({
        "date.base": "Invalid date format",
        "date.isoDate": "Date must be in ISO format",
      }),
    page: Joi.number()
      .integer()
      .min(1)
      .optional()
      .messages({
        "number.base": "Page must be a number",
        "number.integer": "Page must be an integer",
        "number.min": "Page must be at least 1",
      }),
    limit: Joi.number()
      .integer()
      .min(1)
      .optional()
      .messages({
        "number.base": "Limit must be a number",
        "number.integer": "Limit must be an integer",
        "number.min": "Limit must be at least 1",
      }),
  }).optional(),
};

export const validateCreateHoliday = validation(createHolidaySchema);
export const validateUpdateHoliday = validation(updateHolidaySchema);
export const validateDeleteHoliday = validation(deleteHolidaySchema);
export const validateGetHolidays = validation(getHolidaysSchema);
