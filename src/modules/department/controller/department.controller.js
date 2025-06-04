import Department from "../../../../DB/model/Department.js";

// Create department
export const createDepartment = async (req, res) => {
  try {
    const { departmentName } = req.body;

    const department = new Department({ departmentName });
    await department.save();

    res.status(201).json({
      message: "Department created successfully",
      department
    });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};


// Get all departments
export const getAllDepartments = async (req, res) => {
  try {
    const departments = await Department.find(); // جلب كل الأقسام
    res.status(200).json(departments);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};


