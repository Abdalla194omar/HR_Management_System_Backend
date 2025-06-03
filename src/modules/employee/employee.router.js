import express from "express";
import { createEmployee ,getAllEmployees,getEmployeeByid} from "./controller/employee.controller.js";

const router = express.Router();

// create employee
router.post("/",createEmployee); // POST /api/employees/

// get all 
router.get("/", getAllEmployees);


// get by id 
router.get("/:id", getEmployeeByid);




export default router;
