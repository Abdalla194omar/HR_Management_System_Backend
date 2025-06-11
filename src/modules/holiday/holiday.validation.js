import Joi from "joi";

const validateHoliday = (schema) => {
  return (req, res, next) => {
    try {
      let validationErrors = [];

      // Validate request body if schema has body validation
      if (schema.body) {
        const bodyValidation = schema.body.validate(req.body, {
          abortEarly: false,
        });
        if (bodyValidation.error) {
          validationErrors.push(...bodyValidation.error.details);
        }
      }

      // Validate URL parameters if schema has params validation
      if (schema.params) {
        const paramsValidation = schema.params.validate(req.params, {
          abortEarly: false,
        });
        if (paramsValidation.error) {
          validationErrors.push(...paramsValidation.error.details);
        }
      }

      // Validate query parameters if schema has query validation
      if (schema.query) {
        const queryValidation = schema.query.validate(req.query, {
          abortEarly: false,
        });
        if (queryValidation.error) {
          validationErrors.push(...queryValidation.error.details);
        }
      }

      // Handle file uploads if present
      if (schema.file && req.file) {
        const fileValidation = schema.file.validate(req.file, {
          abortEarly: false,
        });
        if (fileValidation.error) {
          validationErrors.push(...fileValidation.error.details);
        }
      }

      if (schema.files && req.files) {
        const filesValidation = schema.files.validate(req.files, {
          abortEarly: false,
        });
        if (filesValidation.error) {
          validationErrors.push(...filesValidation.error.details);
        }
      }

      // If any validation errors occurred
      if (validationErrors.length > 0) {
        req.validationErrors = validationErrors;
        return next(new Error("Validation error", { cause: 400 }));
      }

      return next();
    } catch (error) {
      return next(
        new Error(`Validation middleware error: ${error.message}`, {
          cause: 500,
        })
      );
    }
  };
};

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
      .optional()
      .messages({
        "date.base": "Invalid date format",
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

export default validateHoliday(holidaySchema); 