import mongoose from "mongoose";
const { Schema } = mongoose;

const AttendanceSchema = new Schema(
  {
    employee: {
      type: Schema.Types.ObjectId,
      ref: "Employee",
      required: [true, "Employee reference is required"],
    },
    date: {
      type: Date,
      required: [true, "Attendance date is required"],
    },
    checkInTime: {
      type: String,
      validate: {
        validator: function (v) {
          return /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/.test(v); // HH:mm format
        },
        message: "Check-in time must be in HH:mm format",
      },
    },
    checkOutTime: {
      type: String,
      validate: {
        validator: function (v) {
          return /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/.test(v); // HH:mm format
        },
        message: "Check-out time must be in HH:mm format",
      },
    },
    lateDurationInHours: {
      type: Number,
      min: [0, "Late duration cannot be negative"],
      max: [24, "Late duration cannot exceed 24 hours"],
      default: 0,
    },
    overtimeDurationInHours: {
      type: Number,
      min: [0, "Overtime cannot be negative"],
      max: [24, "Overtime cannot exceed 24 hours"],
      default: 0,
    },
    status: {
      type: String,
      enum: {
        values: ["Present", "Absent", "On Leave"],
        message: "Status must be Present, Absent, or On Leave",
      },
      default: "Present",
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

AttendanceSchema.pre(/^find/, function (next) {
  this.where({ isDeleted: false });
  next();
});

export default mongoose.model("Attendance", AttendanceSchema);
