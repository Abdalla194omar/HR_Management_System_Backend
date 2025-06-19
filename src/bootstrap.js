import express from "express";
import cors from "cors";
import connection from "../DB/connection.js";
import { globalError } from "./middleWare/globalError.js";
import departmentRoutes from "./modules/department/department.router.js";
import employeeRoutes from "./modules/employee/employee.router.js";
import holidayRoutes from "./modules/holiday/holiday.router.js";
import payrollRoutes from "./modules/payroll/payroll.router.js";

import { router as attendanceRoutes } from "./modules/attendance/attendance.router.js";
import authRoutes from "./modules/auth/hr.router.js";

const initializeApp = (app, express) => {
  app.use(
    cors({
      origin: process.env.FRONTEND_URL,
      credentials: true
    })
  );

  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));
  connection();

  app.use("/api/attendance", attendanceRoutes);
  app.use("/api/departments", departmentRoutes);
  app.use("/api/employees", employeeRoutes);
  app.use("/api/auth", authRoutes);

  app.use("/api/holidays", holidayRoutes);
  app.use("/api/payrolls", payrollRoutes);
  app.use(globalError);

  app.use((req, res) => {
    res.status(404).json({
      success: false,
      message: `Can't find this route: ${req.originalUrl}`,
    });
  });
};

export default initializeApp;
