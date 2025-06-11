import Department from "../../../../DB/model/Department.js";
import asyncHandler from "../../../utils/asyncHandeler.js";
import AppError from "../../../utils/AppError.js";


// Create department
export const createDepartment = asyncHandler(async (req, res) => {
  const { departmentName } = req.body;

  const department = new Department({ departmentName });
  await department.save();

  res.status(201).json({
    message: "Department created successfully",
    department
  });
});


// Get all departments
export const getAllDepartments = asyncHandler(async (req, res) => {
  const departments = await Department.find();
  res.status(200).json(departments);
});



// Update department
export const updateDepartment = asyncHandler(async (req, res, next) => {
  const { id } = req.params;
  const { departmentName } = req.body;

  const department = await Department.findById(id);
  if (!department) {
    return next(new AppError("Department not found", 404));
  }

  department.departmentName = departmentName || department.departmentName;
  await department.save();

  res.status(200).json({
    message: "Department updated successfully",
    department,
  });
});



export const deleteDepartment = asyncHandler(async (req, res, next) => {
  const { id } = req.params;

  const department = await Department.findByIdAndDelete(id);
  if (!department) {
    return next(new AppError("Department not found", 404));
  }

  res.status(200).json({ message: "Department deleted successfully" });
});
