import connection from "../DB/connection.js";
import cors from "cors";
import path from "path";
import { globalError } from "./middleWare/globalError.js";
import departmentRoutes from "./modules/department/department.router.js";


import { router as attendanceRoutes } from "./modules/attendance/attendance.router.js";

// import employeeRoutes from "./modules/employee/employee.router.js";
// import departmentRoutes from "./modules/department/department.router.js";
// import holidayRoutes from "./modules/holiday/holiday.router.js";

const initializeApp = (app, express) => {
  app.use(cors());
  app.use(express.json());
  connection();

  app.use("/api/attendance", attendanceRoutes);

  // app.use("/api/employees", employeeRoutes);
  // app.use("/api/departments", departmentRoutes);
  // app.use("/api/holidays", holidayRoutes);

  app.use(globalError);


 app.use('/api/departments', departmentRoutes);


  app.use("/{*any}", (req, res, next) => {
    res.status(404).json({
      success: false,
      message: `Can't find this route: ${req.originalUrl}`,
    });
  });
};

export default initializeApp;
