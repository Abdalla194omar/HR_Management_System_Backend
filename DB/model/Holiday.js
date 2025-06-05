import mongoose from "mongoose";
const { Schema } = mongoose;

const HolidaySchema = new Schema(
  {
    name: {
      type: String,
    },
    date: {
      type: Date,
    },
    type: {
      type: String,
      enum: {
        values: ["Official", "Custom"],
        message: "Type must be either 'Official' or 'Custom'",
      },
      default: "Official",
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

export default mongoose.model("Holiday", HolidaySchema);
