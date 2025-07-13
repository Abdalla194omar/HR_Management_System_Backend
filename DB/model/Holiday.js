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

HolidaySchema.pre("findOneAndUpdate", function (next) {
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

export default mongoose.model("Holiday", HolidaySchema);
