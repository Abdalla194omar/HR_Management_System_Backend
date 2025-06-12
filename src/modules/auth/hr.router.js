import express from "express";
import validateHR from "./hr.validation.js";
import { loginHR } from "./controller/hr.controller.js";
import { loginSchema } from "./hr.validation.js";

const router = express.Router();

router.post("/login", validateHR(loginSchema), loginHR);

export default router;
