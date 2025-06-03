import mongoose from "mongoose";
const { Schema, model } = mongoose;

const EmployeeSchema = new Schema(
  {
    firstName: {
      type: String,
      required: [true, "First name is required"],
      trim: true,
      minlength: [2, "First name must be at least 2 characters"],
      maxlength: [50, "First name must be at most 50 characters"],
    },
    lastName: {
      type: String,
      required: [true, "Last name is required"],
      trim: true,
      minlength: [2, "Last name must be at least 2 characters"],
      maxlength: [50, "Last name must be at most 50 characters"],
    },
    email: {
      type: String,
      required: [true, "Email is required"],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/\S+@\S+\.\S+/, "Email must be a valid format"],
    },
    phone: {
      type: String,
      match: [/^\+?\d{10,15}$/, "Phone number must be valid"],
    },
    department: {
      type: Schema.Types.ObjectId,
      ref: "Department",
      required: [true, "Department is required"],
    },
    hireDate: {
      type: Date,
      validate: {
        validator: function (value) {
          return value <= new Date();
        },
        message: "Hire date cannot be in the future",
      },
    },
    salary: {
      type: Number,
      min: [0, "Salary must be positive"],
    },
    workingHoursPerDay: {
      type: Number,
      min: [1, "Working hours must be at least 1"],
      max: [24, "Working hours must not exceed 24"],
      default: 8,
    },
    defaultCheckInTime: {
      type: String,
      default: "09:00:00",
      match: [
        /^([01]\d|2[0-3]):[0-5]\d(:[0-5]\d)?$/,
        "Check-in time must be HH:mm or HH:mm:ss",
      ],
    },
    defaultCheckOutTime: {
      type: String,
      default: "15:00:00",
      match: [
        /^([01]\d|2[0-3]):[0-5]\d(:[0-5]\d)?$/,
        "Check-out time must be HH:mm or HH:mm:ss",
      ],
    },
    address: {
      type: String,
      maxlength: [200, "Address must not exceed 200 characters"],
    },
    gender: {
      type: String,
      enum: ["Male", "Female"],
    },
    nationality: {
      type: String,
      maxlength: [100, "Nationality must not exceed 100 characters"],
    },
    birthdate: {
      type: Date,
      validate: {
        validator: function (value) {
          return value < new Date();
        },
        message: "Birthdate must be in the past",
      },
    },
    nationalId: {
      type: String,
      unique: true,
      sparse: true,
      match: [/^\d{14}$/, "National ID must be 14 digits"],
    },
    weekendDays: {
      type: [String],
      validate: {
        validator: function (days) {
          const validDays = [
            "Sunday",
            "Monday",
            "Tuesday",
            "Wednesday",
            "Thursday",
            "Friday",
            "Saturday",
          ];
          return days.every((day) => validDays.includes(day));
        },
        message: "Weekend days must be valid days of the week",
      },
      default: ["Friday", "Saturday"],
    },
    overtimeType: {
      type: String,
      enum: ["hour", "Bound"],
      default: "hour",
    },
    overtimeValue: {
      type: Number,
      min: [0, "Overtime value must be positive"],
      default: 0,
    },
    deductionType: {
      type: String,
      enum: ["hour", "Bound"],
      default: "hour",
    },
    deductionValue: {
      type: Number,
      min: [0, "Deduction value must be positive"],
      default: 0,
    },
  },
  { timestamps: true }
);

export default model("Employee", EmployeeSchema);

