import AppError from "../utils/AppError.js";

const validation = (schema) => {
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
        return next(new AppError("Validation error", 400));
      }

      return next();
    } catch (error) {
      return next(
        new AppError(`Validation middleware error: ${error.message}`, 500)
      );
    }
  };
};

export default validation;
