import Department from "../../../../DB/model/Department.js";
import asyncHandler from "../../../utils/asyncHandeler.js";
import AppError from "../../../utils/AppError.js";
import Employee from "../../../../DB/model/Employee.js";
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

//  Delete department
export const deleteDepartment = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const department = await Department.findById(id);
  if (!department) {
    return res.status(404).json({ message: "Department not found" });
  }

  // حذف كل الموظفين اللي ليهم نفس الـ department
  await Employee.deleteMany({ department: id });

  // حذف القسم نفسه
  await department.deleteOne();

  res.status(200).json({ message: "Department and related employees deleted" });
});






// export const deleteDepartment = asyncHandler(async (req, res, next) => {
//   const { id } = req.params;

//   const department = await Department.findOne({ _id: id, isDeleted: false });
//   if (!department) {
//     return next(new AppError("Department not found", 404));
//   }

//   // Soft delete للموظفين المرتبطين بالقسم
//   await Employee.updateMany(
//     { department: id },
//     {
//       isDeleted: true,
//       deletedAt: new Date(),
//     }
//   );

//   // Soft delete للقسم 
//   await Department.findByIdAndUpdate(id, {
//     isDeleted: true,
//     deletedAt: new Date(),
//   });

//   return res.status(200).json({
//     message: "Department and its employees marked as deleted",
//   });
// });


// export const deleteDepartment = asyncHandler(async (req, res, next) => {
//   const { id } = req.params;

//   const department = await Department.findByIdAndDelete(id);
//   if (!department) {
//     return next(new AppError("Department not found", 404));
//   }

//   res.status(200).json({ message: "Department deleted successfully" });
// });
