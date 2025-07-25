import Employee from "../../../../DB/model/Employee.js";
import asyncHandler from "../../../utils/asyncHandeler.js";
import AppError from "../../../utils/AppError.js";
import Department from "../../../../DB/model/Department.js";
import Attendance from "../../../../DB/model/Attendence.js";

// function validate unique field (email,NationalId)
async function validateUniqueFields(req) {
  const { email, nationalId } = req.body;
  const employeeId = req.params.id;
  const existingEmail = await Employee.findOne({ email });
  if (existingEmail && existingEmail._id.toString() !== employeeId) {
    return { isValid: false, message: "Email already exist" };
  }
  const existingNationalId = await Employee.findOne({ nationalId });
  if (existingNationalId && existingNationalId._id.toString() !== employeeId) {
    return { isValid: false, message: "National ID already exist" };
  }
  return { isValid: true, message: "" };
}

// function Pagination
export const paginate = async (
  model,
  query,
  page = 1,
  limit = 10,
  populateOptions = null
) => {
  const skip = (parseInt(page) - 1) * parseInt(limit);
  let dbQuery = model.find(query).skip(skip).limit(limit);
  // Add populate
  if (populateOptions) {
    dbQuery = dbQuery.populate(populateOptions);
  }

  const [data, totalDocuments] = await Promise.all([
    dbQuery,
    model.countDocuments(query),
  ]);

  const totalPages = Math.ceil(totalDocuments / limit);

  return {
    data,
    pagination: {
      totalDocuments,
      totalPages,
      page: Number(page),
      limit: Number(limit),
    },
  };
};

// create employee
export const createEmployee = asyncHandler(async (req, res) => {
  const { isValid, message } = await validateUniqueFields(req);
  if (!isValid) {
    return res.status(409).json({ error: message });
  }
  const employee = new Employee(req.body);
  await employee.save();
  res.status(201).json(employee);
});

// get all employees
export const getAllEmployees = asyncHandler(async (req, res) => {
  const { page = 1, limit = 10 } = req.query;
  const query = { isDeleted: false };
  // add populate
  const result = await paginate(Employee, query, page, limit, {
    path: "department",
    select: "departmentName",
  });

  res.status(200).json({
    message: "Get All employees successfully",
    pagination: result.pagination,
    employees: result.data,
  });
});

// get all employees withOUT PAgination
export const getAllEmployeesWithoutPagination = asyncHandler(
  async (req, res) => {
    const employees = await Employee.find({ isDeleted: false }).populate({
      path: "department",
      select: "departmentName",
    });
    if (employees.length === 0) {
      return next(new AppError("No employees found", 404));
    }
    res
      .status(200)
      .json({ message: "Get All employees successfully", employees });
  }
);

// get all employees with filters
export const getEmployeesFilter = asyncHandler(async (req, res, next) => {
  const { departmentName, hireDate, page = 1, limit = 10 } = req.query;
  const query = { isDeleted: false };

  if (departmentName) {
    const dep = await Department.findOne({ departmentName: departmentName });
    if (dep) query.department = dep._id;
    else query.department = null;
  }
  if (hireDate) {
    const start = new Date(hireDate);
    start.setHours(0, 0, 0, 0);
    const end = new Date(hireDate);
    end.setHours(23, 59, 59, 999);
    query.hireDate = { $gte: start, $lte: end };
  }

  const result = await paginate(Employee, query, page, limit, {
    path: "department",
    select: "departmentName",
  });

  if (result.data.length === 0) {
    return next(new AppError("No employees found matching the filters", 404));
  }

  res.status(200).json({
    message: "Employees with filters and pagination successfully",
    pagination: result.pagination,
    employees: result.data,
  });
});

// get employee by id
export const getEmployeeByid = asyncHandler(async (req, res, next) => {
  const employee = await Employee.findOne({
    _id: req.params.id,
    isDeleted: false,
  }).populate({ path: "department", select: "departmentName" });
  if (!employee) return next(new AppError("Error employee not found", 404));

  res.status(201).json(employee);
});

//  total emp & dep
export const getTotalEmployees = asyncHandler(async (req, res) => {
  const totalEmployees = await Employee.countDocuments({ isDeleted: false });
  const totalDepartments = await Department.countDocuments({
    isDeleted: false,
  });
  res.json({ totalEmployees, totalDepartments });
});

// search by name
export const SearchEmployee = asyncHandler(async (req, res, next) => {
  const { name, page = 1, limit = 10 } = req.query;
  if (!name) return next(new AppError("Error employee Name not found", 400));

  const query = {
    firstName: { $regex: name, $options: "i" },
    isDeleted: false,
  };

  const result = await paginate(Employee, query, page, limit, {
    path: "department",
    select: "departmentName",
  });

  res.status(201).json({
    message: "Search results with pagination",
    pagination: result.pagination,
    employees: result.data,
  });
});

// update
export const updateEmployee = asyncHandler(async (req, res, next) => {
  const { isValid, message } = await validateUniqueFields(req);
  if (!isValid) {
    return res.status(409).json({ error: message });
  }
  const hireDate = new Date(req.body.hireDate);

  // Validate hireDate
  const firstAttendance = await Attendance.findOne({
    employee: req.params.id,
  }).sort({ date: 1 }); // earliest

  if (firstAttendance && hireDate > firstAttendance.date) {
    return next(
      new AppError(
        "Hire date cannot be after the employee's first attendance date.",
        400
      )
    );
  }

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

  const result = await Attendance.updateMany(
    { employee: employee._id },
    {
      isDeleted: true,
    }
  );
  res.status(201).json({ message: "Employee Deleted Successfully" });
});
