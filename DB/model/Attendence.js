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
      required: function () {
        return this.status === "Present";
      },
      validate: {
        validator: function (v) {
          if (this.status !== "Present") return true;
          return /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/.test(v); // HH:mm format
        },
        message: "Check-in time must be in HH:mm format",
      },
    },
    checkOutTime: {
      type: String,
      validate: {
        validator: function (v) {
          if (this.status !== "Present") return true;
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
        values: ["Present", "Absent"],
        message: "Status must be Present or Absent",
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

AttendanceSchema.pre("save", function (next) {
  if (this.isDeleted && !this.deletedAt) {
    this.deletedAt = new Date();
  }

  if (!this.isDeleted) {
    this.deletedAt = null;
  }

  next();
});

AttendanceSchema.pre("updateMany", function (next) {
  const update = this.getUpdate();
  if (update && typeof update.isDeleted !== "undefined") {
    if (update.isDeleted === true && !update.deletedAt) {
      this.setUpdate({ ...update, deletedAt: new Date() });
    } else if (update.isDeleted === false) {
      this.setUpdate({ ...update, deletedAt: null });
    }
  }
  next();
});

export default mongoose.model("Attendance", AttendanceSchema);
