import express from "express";
import { getAllPayrolls } from "./controllers/payroll.controller.js";

const router = express.Router();

router.get("/", getAllPayrolls);

export default router;
