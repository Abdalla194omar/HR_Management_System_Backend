import Joi from "joi";

const validateHR = (schema) => {
  return (req, res, next) => {
    try {
      let validationErrors = [];

      if (schema.body) {
        const bodyValidation = schema.body.validate(req.body, { abortEarly: false }); 
        if (bodyValidation.error) validationErrors.push(...bodyValidation.error.details);
      }

      if (schema.params) {
        const paramsValidation = schema.params.validate(req.params, { abortEarly: false });
        if (paramsValidation.error) validationErrors.push(...paramsValidation.error.details);
      }

      if (validationErrors.length > 0) {
        req.validationErrors = validationErrors; 
        return next(new Error("Validation error", { cause: 400 }));
      }

      return next();
    } catch (error) {
      return next(new Error(`Validation middleware error: ${error.message}`, { cause: 500 }));
    }
  };
};

const loginSchema = {
  body: Joi.object({
    email: Joi.string()
      .required()
      .email()
      .messages({
        "string.email": "Email format is invalid",
        "any.required": "Email is required",
      }),
    password: Joi.string()
      .required()
      .min(8)
      .messages({
        "any.required": "Password is required",
        "string.min": "Password must be at least 8 characters",
      }),
  }),
};

export default validateHR(loginSchema);