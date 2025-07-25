import Joi from "joi";

export const createDepartmentSchema = {
  body: Joi.object({
    departmentName: Joi.string()
      .required()
      .trim()
      .min(2)
      .max(50)
      .pattern(/^[A-Za-z\s]+$/)
      .messages({
        "any.required": "Department name is required",
        "string.empty": "Department name must not be empty",
        "string.min": "Department name must be at least 2 characters",
        "string.max": "Department name must be at most 50 characters",
        "string.pattern.base": "Department name must contain only letters and spaces",
      }),
  }),
};

export const updateDepartmentSchema = {
  params: Joi.object({
    id: Joi.string().length(24).hex().required().messages({
      "string.length": "Invalid id length, must be 24 characters",
      "string.hex": "Id must be a valid hexadecimal string",
      "any.required": "Id is required",
      "string.empty": "Id must not be empty",
    }),
  }),
  body: Joi.object({
    departmentName: Joi.string()
      .trim()
      .min(2)
      .max(50)
      .pattern(/^[A-Za-z\s]+$/)
      .messages({
        "string.empty": "Department name must not be empty",
        "string.min": "Department name must be at least 2 characters",
        "string.max": "Department name must be at most 50 characters",
        "string.pattern.base": "Department name must contain only letters and spaces",
      }),
  }).min(1).messages({
    "object.min": "You must provide at least one field to update",
  }),
};
