import express from "express";
import { createEmployee ,getAllEmployees,getEmployeeByid,SearchEmployee,updateEmployee,deleteEmployee} from "./controller/employee.controller.js";
import {employeeValidationSchema} from './employee.validation.js'
import validation from "../../middleWare/validation.js";

const router = express.Router();

// create employee
router.post("/",validation(employeeValidationSchema),createEmployee); // POST /api/employees/

// get all 
router.get("/", getAllEmployees);


//search 
router.get("/search", SearchEmployee);


// get by id 
router.get("/:id", getEmployeeByid);

// update 
router.put('/:id',validation(employeeValidationSchema), updateEmployee);


// delete 
router.delete('/:id', deleteEmployee);




export default router;
