// const Department = require('../../../../DB/model/Department.js');

// // Create
// exports.createDepartment = async (req, res) => {
//   try {
//     const { name, description } = req.body;
//     const department = await Department.create({ name, description });
//     res.status(201).json(department);
//   } catch (error) {
//     res.status(500).json({ error: error.message });
//   }
// };

// // Read
// exports.getDepartments = async (req, res) => {
//   try {
//     const departments = await Department.findAll();
//     res.status(200).json(departments);
//   } catch (error) {
//     res.status(500).json({ error: error.message });
//   }
// };

// // Update
// exports.updateDepartment = async (req, res) => {
//   try {
//     const { id } = req.params;
//     const { name, description } = req.body;
//     const department = await Department.findByPk(id);
//     if (!department) return res.status(404).json({ message: 'Not found' });

//     department.name = name;
//     department.description = description;
//     await department.save();

//     res.json(department);
//   } catch (error) {
//     res.status(500).json({ error: error.message });
//   }
// };

// // Delete
// exports.deleteDepartment = async (req, res) => {
//   try {
//     const { id } = req.params;
//     const department = await Department.findByPk(id);
//     if (!department) return res.status(404).json({ message: 'Not found' });

//     await department.destroy();
//     res.json({ message: 'Deleted successfully' });
//   } catch (error) {
//     res.status(500).json({ error: error.message });
//   }
// };
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
