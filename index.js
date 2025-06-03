import express from "express";
import dotenv from "dotenv";
import initializeApp from "./src/bootstrap.js";
import employeeRoutes from './src/modules/employee/employee.router.js'

dotenv.config({ path: "./config/.env" });

const port = process.env.PORT || 5000;
const app = express();
initializeApp(app, express);

app.use('/api/employees', employeeRoutes);



app.use("/{*any}", (req, res, next) => {
    res.status(404).json({
      success: false,
      message: `Can't find this route: ${req.originalUrl}`,
    });
  });

app.listen(port, () => {
  console.log(`Server running successfully on port ${port}`);
});
