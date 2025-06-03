import Employee from '../../../../DB/model/Employee.js';


// create employee
export const createEmployee = async (req, res) => {
  try {
    const employee = new Employee(req.body);
    await employee.save();
    res.status(201).json(employee);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// get all employee
export const getAllEmployees =async(req,res)=>{
  try {
    const employees = await Employee.find();
    res.status(201).json(employees);
    
  } catch (error) {
        res.status(500).json({ message: error.message });

  }

};

// get employee by id 
export const getEmployeeByid =async(req,res)=>{
  try {
    const employee = await Employee.findById(req.params.id);
    if (!employee) {
      return res.status(404).json({message:"Error employee not found"});
    }
    res.status(201).json(employee);
    
  } catch (error) {
        res.status(500).json({ message: error.message });

  }

};
