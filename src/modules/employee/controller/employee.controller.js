import Employee from '../../../../DB/model/Employee.js';

import asyncHandler from 'express-async-handler';
import AppError from '../../../utils/AppError.js';



// create employee
export const createEmployee = asyncHandler(async (req, res) => {
    const employee = new Employee(req.body);
    await employee.save();
    res.status(201).json(employee); 
}
);


// get all employee
export const getAllEmployees =asyncHandler( async(req,res)=>{
  
    const employees = await Employee.find({ isDeleted: false });
    res.status(201).json(employees);
});

// get employee by id 

export const getEmployeeByid =asyncHandler(
  async(req,res,next)=>{
  
    const employee = await Employee.findById({_id: req.params.id, isDeleted: false} );
    if (!employee) return next(new AppError("Error employee not found",404));
    
    res.status(201).json(employee);
  });

// search by name 
export const SearchEmployee = asyncHandler(async(req,res,next)=>{
  
    const {name} = req.query;
    if (!name) return next(new AppError("Error employee Name not found",400));
  
    const employees = await Employee.find({
      firstName: { $regex: name, $options: 'i' },
        isDeleted: false
    });
        res.status(201).json(employees);


});

// update 

export const updateEmployee = asyncHandler(async(req,res,next)=>{
  
    const employee = await Employee.findByIdAndUpdate(req.params.id, req.body,{ new: true, runValidators: true }  ) ;
    if (!employee) return next(new AppError("Error employee not found",400));
    
     res.status(201).json(employee);
  
});



// delete 
export const deleteEmployee =asyncHandler(async(req,res,next)=>{
  
     const employee = await Employee.findByIdAndUpdate(req.params.id,{ isDeleted: true },
  { new: true });

      if (!employee) return next(new AppError("Error employee not found",400));
     res.status(201).json({message:"Employee Deleted Successfully"});
    

});
