import mongoose from "mongoose";
const { Schema } = mongoose;

const HolidaySchema = new Schema(
  {
    name: {
      type: String,
      required: [true, "Holiday name is required"],
      trim: true,
      minlength: [2, "Holiday name must be at least 2 characters"],
      maxlength: [100, "Holiday name must be at most 100 characters"],
    },
    date: {
      type: Date,
      required: [true, "Holiday date is required"],
      validate: {
        validator: function (value) {
          return value instanceof Date && !isNaN(value.getTime());
        },
        message: "Invalid holiday date",
      },
    },
    type: {
      type: String,
      enum: {
        values: ["Official", "Custom"],
        message: "Type must be either 'Official' or 'Custom'",
      },
      default: "Official",
    },
  },
  { timestamps: true }
);

export default mongoose.model("Holiday", HolidaySchema);
