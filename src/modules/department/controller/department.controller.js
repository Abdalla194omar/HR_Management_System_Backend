import Department from "../../../../DB/model/Department.js";
import asyncHandler from "../../../utils/asyncHandeler.js";
import AppError from "../../../utils/AppError.js";
import Employee from "../../../../DB/model/Employee.js";
import Attendance from "../../../../DB/model/Attendence.js";

// ✅ Create department
export const createDepartment = asyncHandler(async (req, res, next) => {
  const { departmentName } = req.body;

  // Check if department already exists (case insensitive)
  const existing = await Department.findOne({
    departmentName: { $regex: new RegExp(`^${departmentName}$`, "i") },
    isDeleted: false,
  });

  if (existing) {
    return next(new AppError("Department with this name already exists", 400));
  }

  const department = new Department({ departmentName });
  await department.save();

  res.status(201).json({
    message: "Department created successfully",
    department,
  });
});

// ✅ Get all departments (only not deleted)
export const getAllDepartments = asyncHandler(async (req, res) => {
  const departments = await Department.find({ isDeleted: false });
  res.status(200).json(departments);
});

// ✅ Update department
export const updateDepartment = asyncHandler(async (req, res, next) => {
  const { id } = req.params;
  const { departmentName } = req.body;

  const department = await Department.findOne({ _id: id, isDeleted: false });
  if (!department) {
    return next(new AppError("Department not found", 404));
  }

  // Check for duplicate name (excluding current department)
  if (departmentName) {
    const existing = await Department.findOne({
      _id: { $ne: id },
      departmentName: { $regex: new RegExp(`^${departmentName}$`, "i") },
      isDeleted: false,
    });

    if (existing) {
      return next(
        new AppError("Another department with this name already exists", 400)
      );
    }

    department.departmentName = departmentName;
  }

  await department.save();

  res.status(200).json({
    message: "Department updated successfully",
    department,
  });
});

// ✅ Soft Delete department
export const deleteDepartment = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const department = await Department.findOne({ _id: id, isDeleted: false });
  if (!department) {
    return res
      .status(404)
      .json({ message: "Department not found or already deleted" });
  }

  // Get all employees in the department
  const employeesInDepartment = await Employee.find({
    department: id,
    isDeleted: false,
  });

  // Extract their IDs
  const employeeIds = employeesInDepartment.map((emp) => emp._id);

  // Soft delete attendance records of these employees
  await Attendance.updateMany(
    { employee: { $in: employeeIds } },
    { $set: { isDeleted: true } }
  );

  // Soft delete the employees
  await Employee.updateMany(
    { _id: { $in: employeeIds } },
    { $set: { isDeleted: true } }
  );

  // Soft delete the department itself
  department.isDeleted = true;
  await department.save();

  res.status(200).json({
    message: "Soft deleted department, employees, and attendance records",
  });
});
