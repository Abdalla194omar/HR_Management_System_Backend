import Joi from 'joi';

export const employeeValidationSchema = Joi.object({
  firstName: Joi.string().min(2).max(50).required(),
  lastName: Joi.string().min(2).max(50).required(),
  email: Joi.string().email().required(),
  phone: Joi.string().pattern(/^\+?\d{10,15}$/).required(),
  department: Joi.string().required(),
  hireDate: Joi.date().less('now').required(),
  salary: Joi.number().min(0),
  workingHoursPerDay: Joi.number().min(1).max(24).default(8),
  defaultCheckInTime: Joi.string().pattern(/^([01]\d|2[0-3]):[0-5]\d(:[0-5]\d)?$/),
  defaultCheckOutTime: Joi.string().pattern(/^([01]\d|2[0-3]):[0-5]\d(:[0-5]\d)?$/),
  address: Joi.string().max(200),
  gender: Joi.string().valid("Male", "Female"),
  nationality: Joi.string().max(100),
  birthdate: Joi.date().less('now').required(),
  nationalId: Joi.string().pattern(/^\d{14}$/).required(),
  weekendDays: Joi.array().items(
    Joi.string().valid("Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday")
  ).default(["Friday", "Saturday"]),
  overtimeType: Joi.string().valid("hour", "Bound").default("hour"),
  overtimeValue: Joi.number().min(0).default(0),
  deductionType: Joi.string().valid("hour", "Bound").default("hour"),
  deductionValue: Joi.number().min(0).default(0)
});
