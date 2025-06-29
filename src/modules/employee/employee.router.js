import express from "express";
import * as controllers from "./controller/employee.controller.js";
import validation from "../../middleWare/validation.js";
import * as schemas from "./employee.validation.js";

const router = express.Router();

// create employee
router.post(
  "/",
  validation(schemas.createEmployeeSchema),
  controllers.createEmployee
); // POST /api/employees/

// get all
router.get("/all", controllers.getAllEmployees);

// GET withOUT pagination
router.get(
  "/all/without-pagination",
  controllers.getAllEmployeesWithoutPagination
);

// get all by filter
router.get(
  "/",
  validation(schemas.getEmployeesFilterSchema),
  controllers.getEmployeesFilter
);

// total
router.get("/total", controllers.getTotalEmployees);

//search
router.get("/search", controllers.SearchEmployee);

// get by id
router.get("/:id", controllers.getEmployeeByid);

// update
router.patch(
  "/:id",
  validation(schemas.updateEmployeeSchema),
  controllers.updateEmployee
);

// delete
router.delete("/:id", controllers.deleteEmployee);

export default router;
