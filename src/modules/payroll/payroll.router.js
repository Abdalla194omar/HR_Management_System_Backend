import express from "express";

import {
  getAllPayrolls,
  getEmployeePayroll, // 
} from "./controllers/payroll.controller.js";

const router = express.Router();

router.get("/", getAllPayrolls);

router.get("/employee", getEmployeePayroll); // 

export default router;
