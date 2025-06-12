
import Joi from "joi";
import validation from "../../middleWare/validation.js";

const holidaySchema = {
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
      .optional()
      .messages({
        "date.base": "Invalid date format",
        "date.min": "Holiday date cannot be in the past",
      }),
    type: Joi.string()
      .valid("Official", "Custom")
      .optional()
      .messages({
        "any.only": "Type must be either 'Official' or 'Custom'",
      }),
  }).min(1),

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

  query: Joi.object({
    type: Joi.string()
      .valid("Official", "Custom")
      .messages({
        "any.only": "Type must be either 'Official' or 'Custom'",
      }),
    date: Joi.date().messages({
      "date.base": "Invalid date format",
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

export const validateHoliday = validation(holidaySchema);