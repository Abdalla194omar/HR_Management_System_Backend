import Joi from "joi";

export const createHolidaySchema = {
  body: Joi.object({
    name: Joi.string().required().min(2).max(100).trim().messages({
      "string.empty": "Holiday name is required",
      "string.min": "Holiday name must be at least 2 characters",
      "string.max": "Holiday name must be at most 100 characters",
    }),
    date: Joi.date().required().messages({
      "date.base": "Invalid holiday date",
      "any.required": "Holiday date is required",
    }),
    type: Joi.string()
      .valid("Official", "Custom")
      .default("Official")
      .messages({
        "any.only": "Type must be either 'Official' or 'Custom'",
      }),
  }),
};
