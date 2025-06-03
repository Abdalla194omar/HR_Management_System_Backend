import express from "express";
import { getAllEmployees } from "./controller/controller.js";

const router = express.Router();
// Get all employees

console.log("ddddd");
router.get("/employees", getAllEmployees);

export default router;
