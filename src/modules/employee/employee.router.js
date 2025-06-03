import express from "express";
import { createEmployee ,getAllEmployees } from "./controller/employee.controller.js";

const router = express.Router();


router.post("/",createEmployee); // POST /api/employees/

// get all 

router.get("/", getAllEmployees);


export default router;
