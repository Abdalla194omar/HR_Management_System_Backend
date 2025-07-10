import Department from "../../../../DB/model/Department.js";
import asyncHandler from "../../../utils/asyncHandeler.js";
import AppError from "../../../utils/AppError.js";
import Employee from "../../../../DB/model/Employee.js";
import Attendance from "../../../../DB/model/Attendence.js";

// ✅ Create department
export const createDepartment = asyncHandler(async (req, res, next) => {
  const { departmentName } = req.body;

  //  Check if department already exists (case insensitive)
  const existing = await Department.findOne({
    departmentName: { $regex: new RegExp(`^${departmentName}$`, "i") },
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

//  Get all departments
export const getAllDepartments = asyncHandler(async (req, res) => {
  const departments = await Department.find();
  res.status(200).json(departments);
});

//  Update department
export const updateDepartment = asyncHandler(async (req, res, next) => {
  const { id } = req.params;
  const { departmentName } = req.body;

  const department = await Department.findById(id);
  if (!department) {
    return next(new AppError("Department not found", 404));
  }

  //  Check for duplicate name (excluding current department)
  if (departmentName) {
    const existing = await Department.findOne({
      _id: { $ne: id },
      departmentName: { $regex: new RegExp(`^${departmentName}$`, "i") },
    });

    if (existing) {
      return next(new AppError("Another department with this name already exists", 400));
    }

    department.departmentName = departmentName;
  }

  await department.save();

  res.status(200).json({
    message: "Department updated successfully",
    department,
  });
});

// //  Delete department
// export const deleteDepartment = asyncHandler(async (req, res) => {
//   const { id } = req.params;

//   const department = await Department.findById(id);
//   if (!department) {
//     return res.status(404).json({ message: "Department not found" });
//   }

//   // حذف كل الموظفين اللي ليهم نفس الـ department
//   await Employee.deleteMany({ department: id });

//   // حذف القسم نفسه
//   await department.deleteOne();

//   res.status(200).json({ message: "Department and related employees deleted" });
// });

// Delete department
export const deleteDepartment = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const department = await Department.findById(id);
  if (!department) {
    return res.status(404).json({ message: "Department not found" });
  }

  // جيب كل الموظفين اللي في القسم
  const employeesInDepartment = await Employee.find({ department: id });

  // استخرج الـ IDs بتاعتهم
  const employeeIds = employeesInDepartment.map((emp) => emp._id);

  // احذف الـ attendance الخاص بيهم
  await Attendance.deleteMany({ employee: { $in: employeeIds } });

  // احذف الموظفين
  await Employee.deleteMany({ department: id });

  // احذف القسم نفسه
  await department.deleteOne();

  res.status(200).json({ message: "Department, employees, and attendance records deleted" });
});



