import Joi from 'joi';

export const createEmployeeSchema = {

  body: Joi.object({
    firstName: Joi.string().trim().min(3).max(50).required().messages({
    "string.empty":"First name is required",
    "string.min": "First name must be at least 3 characters",
    "string.max": "First name  must not exceed 50 characters",
    "any.required": "First name is required",
    }),
    lastName: Joi.string().trim().min(3).max(50).required().messages({
    "string.empty":"last name is required",
    "string.min": "last name must be at least 3 characters",
    "string.max": "last name  must not exceed 50 characters",
    "any.required": "last name is required",
    }),
    email: Joi.string().email().required().messages({
        "string.email": "Please enter a valid email address",
        "string.empty": "Email is required",
        "any.required": "Email is required",
      }),
    phone: Joi.string().pattern(/^\+?\d{10,15}$/).required().messages({
        "string.pattern.base": "Please enter a valid phone number (11 digits)",
        "string.empty": "Phone number is required",
        "any.required": "Phone number is required",
      }),
    department: Joi.string().required().messages({
        "string.length": "Department ID must be 24 characters",
        "string.hex": "Department ID must be a valid hexadecimal string",
        "any.required": "Department ID is required",
      }),
    hireDate: Joi.date().less('now').min("2008-01-01").required().messages({
        "date.base": "Please enter a valid hire date",
        "date.less": "Hire date cannot be in the future",
        "date.min": "Hire date must not be before 2008",
        "any.required": "Hire date is required",
      }),
    salary: Joi.number().min(0).required()
      .messages({
        "number.base": "Please enter a valid salary",
        "number.min": "Salary cannot be negative",
        "any.required": "Salary is required",
      }),
    workingHoursPerDay: Joi.number().min(1).max(24).default(8).messages({
        "number.base": "Please enter a valid number of working hours",
        "number.min": "Working hours must be at least 1",
        "number.max": "Working hours must not exceed 24",
      }),
    defaultCheckInTime: Joi.string().pattern(/^([01]\d|2[0-3]):[0-5]\d(:[0-5]\d)?$/),
    defaultCheckOutTime: Joi.string().pattern(/^([01]\d|2[0-3]):[0-5]\d(:[0-5]\d)?$/),
    address: Joi.string().max(200).messages({
        "string.max": "Address must not exceed 200 characters",
      }),
    gender: Joi.string().valid("Male", "Female"),
    nationality: Joi.string().max(100),
    birthdate: Joi.date().less('now').max(new Date(new Date().setFullYear(new Date().getFullYear() - 20))).required().messages({
        "date.base": "Please enter a valid birthdate",
        "date.max": "Employee must be at least 20 years old",
        "any.required": "Birthdate is required",
      }),
    nationalId: Joi.string().pattern(/^\d{14}$/).required().messages({
        "string.pattern.base": "National ID must be 14 digits",
        "string.empty": "National ID is required",
        "any.required": "National ID is required",
      }),
    weekendDays: Joi.array().items(
      Joi.string().valid("Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday")
    ).default(["Friday", "Saturday"]),
    overtimeType: Joi.string().valid("hour", "Bound").default("hour"),
    overtimeValue: Joi.number().min(0).default(0),
    deductionType: Joi.string().valid("hour", "Bound").default("hour"),
    deductionValue: Joi.number().min(0).default(0)
  })
}

