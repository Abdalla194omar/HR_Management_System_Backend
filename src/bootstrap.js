import express from "express";
import cors from "cors";
import connection from "../DB/connection.js";
import { globalError } from "./middleWare/globalError.js";
import holidayRoutes from "./modules/holiday/holiday.router.js";
import authRoutes from "./modules/auth/hr.router.js";

const initializeApp = (app, express) => {
  app.use(cors());
  app.use(express.json());
  connection();
app.use("/api/auth", authRoutes);

  app.use("/api/holidays", holidayRoutes);

 
  app.use(globalError);

  
  app.use((req, res) => {
    res.status(404).json({
      success: false,
      message: `Can't find this route: ${req.originalUrl}`,
    });
  });

  
};

export default initializeApp;