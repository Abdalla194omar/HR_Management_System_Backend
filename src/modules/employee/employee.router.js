import express from "express";
import {
  createEmployee,
  getAllEmployees,
  getEmployeeByid,
  SearchEmployee,
  updateEmployee,
  deleteEmployee,
} from "./controller/employee.controller.js";
import validation from "../../middleWare/validation.js";
import {createEmployeeSchema} from './employee.validation.js'

const router = express.Router();

// create employee
router.post("/",validation(createEmployeeSchema),createEmployee); // POST /api/employees/

// get all
router.get("/", getAllEmployees);

//search
router.get("/search", SearchEmployee);

// get by id
router.get("/:id", getEmployeeByid);

// update
router.put("/:id", updateEmployee);

// delete
router.delete("/:id", deleteEmployee);

export default router;
