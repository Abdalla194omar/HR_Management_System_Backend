import Employee from '../../../../DB/model/Employee.js';

import asyncHandler from 'express-async-handler';
import AppError from '../../../utils/AppError.js';
import { employeeValidationSchema } from '../employee.validation.js' ;



// create employee
export const createEmployee = asyncHandler(async (req, res,next) => {
    const {error} = employeeValidationSchema.validate(req.body);
    if (error){
      return next(new AppError(400,"validation error "))
    }
 
    const employee = new Employee(req.body);
    await employee.save();
    res.status(201).json(employee); 
}
);



// get all employee
export const getAllEmployees = async(req,res)=>{
  try {
    const employees = await Employee.find();
    res.status(201).json(employees);
    
  } catch (error) {
        res.status(500).json({ message: error.message });

  }

};

// get employee by id 
export const getEmployeeByid =
  async(req,res)=>{
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




// search by name 
export const SearchEmployee = async(req,res)=>{
  try {
    const {name} = req.query;
    if (!name) {
      return res.status(404).json({message:"Error employee Name not found"});
    }

    const employees = await Employee.find({
      firstName: { $regex: name, $options: 'i' } 
    });
        res.status(201).json(employees);
    
  } catch (error) {
        res.status(500).json({ message: error.message });
  }

};

// update 

export const updateEmployee =async(req,res)=>{
  try {
  
    const employee = await Employee.findByIdAndUpdate(req.params.id, req.body,{ new: true, runValidators: true }  ) ;
    if (!employee)
    {
            return res.status(404).json({message:"Error employee not found"});
 
    }
     res.status(201).json(employee);
    
  } catch (error) {
        res.status(500).json({ message: error.message });
  }
};



// delete 
export const deleteEmployee =async(req,res)=>{
  try {
     const employee = await Employee.findByIdAndDelete(req.params.id);

      if (!employee)
    {
            return res.status(404).json({message:"Error employee not found"});
 
    }
     res.status(201).json({message:"Employee Delete Successfully"});
    
  } catch (error) {
     res.status(500).json({ message: error.message});
    
  }
}


