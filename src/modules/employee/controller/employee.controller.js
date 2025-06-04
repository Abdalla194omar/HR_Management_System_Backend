import Employee from '../../../../DB/model/Employee.js';

import asyncHandler from 'express-async-handler';
import AppError from '../../../utils/AppError.js';
import { employeeValidationSchema } from '../employee.validation.js' ;



// create employee
export const createEmployee = asyncHandler(async (req, res,next) => {
    const {error} = employeeValidationSchema.validate(req.body);
    if (error){
      return next(new AppError("validation error ",400))
    }
 
    const employee = new Employee(req.body);
    await employee.save();
    res.status(201).json(employee); 
}
);



// get all employee
export const getAllEmployees =asyncHandler( async(req,res)=>{
  
    const employees = await Employee.find();
    res.status(201).json(employees);
});

// get employee by id 

export const getEmployeeByid =asyncHandler(
  async(req,res,next)=>{
  
    const employee = await Employee.findById(req.params.id);
    if (!employee) {
      return next(new AppError("Error employee not found",404));
    }
    res.status(201).json(employee);
  

  });

// search by name 
export const SearchEmployee = asyncHandler(async(req,res,next)=>{
  
    const {name} = req.query;
    if (!name) {
      return next(new AppError("Error employee Name not found",400));
  
    }

    const employees = await Employee.find({
      firstName: { $regex: name, $options: 'i' } 
    });
        res.status(201).json(employees);


});

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
