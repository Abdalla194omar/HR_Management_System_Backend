import Joi from "joi";

export const chatSchema = Joi.object({
  message: Joi.string().required().min(1).messages({
    "string.empty": "Message is required",
    "string.min": "Message must be at least 1 character long",
  }),
  language: Joi.string().valid("ar", "en").required().messages({
    "any.only": 'Language must be either "ar" or "en"',
    "any.required": "Language is required",
  }),
});
