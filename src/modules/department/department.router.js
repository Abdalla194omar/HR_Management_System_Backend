import express from "express";
import { createDepartment , getAllDepartments} from "../department/controller/department.controller.js";

const router = express.Router();

// POST /api/departments
router.post("/", createDepartment);

// GET /api/departments
router.get("/", getAllDepartments);

export default router;

