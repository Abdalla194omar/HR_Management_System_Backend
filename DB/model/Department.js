import mongoose from "mongoose";
const { Schema } = mongoose;

const DepartmentSchema = new Schema(
  {
    departmentName: {
      type: String,
      required: [true, "Department name is required"],
      trim: true,
      minlength: [2, "Department name must be at least 2 characters"],
      maxlength: [50, "Department name must be at most 50 characters"],
      match: [
        /^[A-Za-z\s]+$/,
        "Department name must contain only letters and spaces",
      ],
    },
  },
  { timestamps: true }
);

export default mongoose.model("Department", DepartmentSchema);
