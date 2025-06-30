import express from "express";
import validateHR from "./hr.validation.js";
import { loginHR } from "./controller/hr.controller.js";
import {register} from "./controller/hr.controller.js";
import { loginSchema,registerSchema } from "./hr.validation.js";

const router = express.Router();

router.post("/login", validateHR(loginSchema), loginHR);
router.post("/register", validateHR(registerSchema),register);

export default router;



