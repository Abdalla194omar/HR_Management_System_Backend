import connection from "../DB/connection.js";
import cors from "cors";
import path from "path";
import { globalError } from "./middleWare/globalError.js";
import employeeRoutes from './modules/employee/employee.router.js'


const initializeApp = (app, express) => {
  app.use(cors());
  app.use(express.json());
  connection();

  app.use(globalError);

  app.use('/api/employees', employeeRoutes);



app.use("/{*any}", (req, res, next) => {
    res.status(404).json({
      success: false,
      message: `Can't find this route: ${req.originalUrl}`,
    });
  });

  
};

export default initializeApp;
