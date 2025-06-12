import Employee from "../../../../DB/model/Employee.js";

import asyncHandler from "../../../utils/asyncHandeler.js";

import AppError from "../../../utils/AppError.js";

// create employee
export const createEmployee = asyncHandler(async (req, res) => {
  const employee = new Employee(req.body);
  await employee.save();
  res.status(201).json(employee);
  
});

// get all employee
export const getAllEmployees = asyncHandler(async (req, res) => {
  const employees = await Employee.find({ isDeleted: false });
  res.status(200).json({ message: "Get All employees successfully", employees });
});

// get all employees with filters
export const getEmployeesFilter = asyncHandler(async (req, res, next) => {
  const { departmentId, hireDate ,page = 1, limit = 10} = req.query;
  const query = { isDeleted: false };

  if (departmentId) query.department = departmentId;
  if (hireDate) query.hireDate =  { $gte: new Date(`${hireDate}-01`), $lte: new Date(`${hireDate}-31`) }; 

  const skip = (parseInt(page) - 1) * parseInt(limit);
  const employees = await Employee.find(query).skip(skip).limit(parseInt(limit)); 
  const totalEmployees = await Employee.countDocuments(query);
  const totalPages = Math.ceil(totalEmployees / limit);

  if (employees.length === 0) {
    return next(new AppError("No employees found matching the filters", 404));
  }

  res.status(200).json({ message: "Employees with filters and pagination successfully",pagination: {
      totalEmployees,
      totalPages,
      page: page,
      limit: limit,
    }, employees });
});

// get employee by id

export const getEmployeeByid = asyncHandler(async (req, res, next) => {
  const employee = await Employee.findById({
    _id: req.params.id,
    isDeleted: false,
  });
  if (!employee) return next(new AppError("Error employee not found", 404));

  res.status(201).json(employee);
});

// search by name
export const SearchEmployee = asyncHandler(async (req, res, next) => {
  const { name } = req.query;
  if (!name) return next(new AppError("Error employee Name not found", 400));

  const employees = await Employee.find({
    firstName: { $regex: name, $options: "i" },
    isDeleted: false,
  });
  res.status(201).json(employees);
});


// update

export const updateEmployee = asyncHandler(async (req, res, next) => {
  const employee = await Employee.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true,
  });
  if (!employee) return next(new AppError("Error employee not found", 400));

  res.status(201).json(employee);
});

// delete
export const deleteEmployee = asyncHandler(async (req, res, next) => {
  const employee = await Employee.findByIdAndUpdate(
    req.params.id,
    { isDeleted: true },
    { new: true }
  );

  if (!employee) return next(new AppError("Error employee not found", 400));
  res.status(201).json({ message: "Employee Deleted Successfully" });
});
