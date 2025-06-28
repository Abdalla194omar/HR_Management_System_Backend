import express from "express";

import {
  getAllPayrolls,
  getPayrollByEmployee,
} from "./controllers/payroll.controller.js";

const router = express.Router();

router.get("/", getAllPayrolls);

router.get("/employee", getPayrollByEmployee);

export default router;
