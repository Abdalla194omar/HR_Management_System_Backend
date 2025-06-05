import express from "express";
import {
  createDepartment,
  getAllDepartments,
  updateDepartment,
  deleteDepartment,
} from "../department/controller/department.controller.js";
import validation from "../../middleWare/validation.js";
import {
  createDepartmentSchema,
  updateDepartmentSchema,
} from "./department.validation.js";

const router = express.Router();

// POST /api/departments
router.post("/", validation(createDepartmentSchema), createDepartment);
// router.post("/", createDepartment);

// GET /api/departments
router.get("/", getAllDepartments);

// PUT /api/departments/:id
router.put("/:id", validation(updateDepartmentSchema), updateDepartment);

// DELETE /api/departments/:id
router.delete("/:id", deleteDepartment);

export default router;
