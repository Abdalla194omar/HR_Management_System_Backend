import mongoose from "mongoose";
const { Schema } = mongoose;

const PayrollSchema = new Schema(
  {
    employee: {
      type: Schema.Types.ObjectId,
      ref: "Employee",
      required: [true, "Employee reference is required"],
    },
    month: {
      type: String,
      required: [true, "Month is required"],
      match: [/^(0[1-9]|1[0-2])-\d{4}$/, "Month must be in MM-YYYY format"],
    },
    monthDays: {
      type: Number,
      min: [0, "Month days must be a non-negative number"],
      max: [31, "Month days must not exceed 31"],
    },
    attendedDays: {
      type: Number,
      default: 0,
      min: [0, "Attended days must be at least 0"],
    },
    absentDays: {
      type: Number,
      default: 0,
      min: [0, "Absent days must be at least 0"],
    },
    totalOvertime: {
      type: Number,
      default: 0,
      min: [0, "Overtime hours must be at least 0"],
    },
    totalBonusAmount: {
      type: Number,
      default: 0,
      min: [0, "Bonus amount must be at least 0"],
    },
    totalDeduction: {
      type: Number,
      default: 0,
      min: [0, "Deduction hours must be at least 0"],
    },
    totalDeductionAmount: {
      type: Number,
      default: 0,
      min: [0, "Deduction amount must be at least 0"],
    },
    salaryPerHour: {
      type: Number,
      min: [0, "Salary per hour must be at least 0"],
    },
    netSalary: {
      type: Number,
      min: [0, "Net salary must be at least 0"],
    },
    generatedBy: {
      type: Schema.Types.ObjectId,
      ref: "HR",
    },
    isDeleted: {
      type: Boolean,
      default: false,
    },
    deletedAt: {
      type: Date,
      default: null,
      validate: {
        validator: function (value) {
          return value === null || value <= new Date();
        },
        message: "Deleted date must be in the past or null",
      },
    },
  },
  { timestamps: true }
);

export default mongoose.model("Payroll", PayrollSchema);
