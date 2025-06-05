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

// Update department
export const updateDepartment = async (req, res) => {
  try {
    const { id } = req.params;
    const { departmentName } = req.body;

    const department = await Department.findById(id);
    if (!department) {
      return res.status(404).json({ message: "Department not found" });
    }

    department.departmentName = departmentName || department.departmentName;
    await department.save();

    res.status(200).json({
      message: "Department updated successfully",
      department,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Delete department
export const deleteDepartment = async (req, res) => {
  try {
    const { id } = req.params;

    const department = await Department.findByIdAndDelete(id);
    if (!department) {
      return res.status(404).json({ message: "Department not found" });
    }

    res.status(200).json({ message: "Department deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

