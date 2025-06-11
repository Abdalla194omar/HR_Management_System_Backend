import express from "express";
import {
  createEmployee,
  getAllEmployees,
  getEmployeeByid,
  SearchEmployee,
  updateEmployee,
  deleteEmployee,
  getEmployeesFilter
} from "./controller/employee.controller.js";
import validation from "../../middleWare/validation.js";
import {createEmployeeSchema,updateEmployeeSchema,getEmployeesFilterSchema} from './employee.validation.js'

const router = express.Router();

// create employee
router.post("/",validation(createEmployeeSchema),createEmployee); // POST /api/employees/

// get all
router.get("/all", getAllEmployees);

// get all by filter 
router.get("/", validation(getEmployeesFilterSchema),getEmployeesFilter);


//search
router.get("/search", SearchEmployee);

// get by id
router.get("/:id", getEmployeeByid);

// update
router.put("/:id",validation(updateEmployeeSchema), updateEmployee);

// delete
router.delete("/:id", deleteEmployee);

export default router;
