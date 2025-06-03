import mongoose from "mongoose";
const { Schema } = mongoose;

const HRSchema = new Schema(
  {
    email: {
      type: String,
      required: [true, "Email is required"],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/\S+@\S+\.\S+/, "Email format is invalid"],
    },
    passwordHash: {
      type: String,
      required: [true, "Password hash is required"],
      minlength: [60, "Password hash must be a valid hashed string"],
    },
    name: {
      type: String,
      required: [true, "Name is required"],
      trim: true,
      minlength: [2, "Name must be at least 2 characters"],
      maxlength: [100, "Name must be at most 100 characters"],
    },
  },
  { timestamps: true }
);

export default mongoose.model("HR", HRSchema);
