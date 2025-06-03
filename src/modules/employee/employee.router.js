import express from "express";
import { createEmployee ,getAllEmployees,getEmployeeByid,SearchEmployee,updateEmployee} from "./controller/employee.controller.js";

const router = express.Router();

// create employee
router.post("/",createEmployee); // POST /api/employees/

// get all 
router.get("/", getAllEmployees);

//search 
router.get("/search", SearchEmployee);


// get by id 
router.get("/:id", getEmployeeByid);

// update 
router.put('/:id', updateEmployee);







export default router;
