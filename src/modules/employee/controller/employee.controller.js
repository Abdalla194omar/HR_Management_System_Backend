import Employee from '../../../../DB/model/Employee.js';

export const createEmployee = async (req, res) => {
  try {
    const employee = new Employee(req.body);
    await employee.save();
    res.status(201).json(employee);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

export const getAllEmployees =async(req,res)=>{
  try {
    const employees = await Employee.find();
    res.status(201).json(employees);
    
  } catch (error) {
        res.status(500).json({ message: error.message });

  }

}

