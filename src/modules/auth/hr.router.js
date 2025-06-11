import express from "express";
import validateAuth from "./hr.validation.js";
import { registerHR, loginHR } from "./controller/hr.controller.js";

const router = express.Router();

router.post("/register", validateAuth, registerHR);
router.post("/login", validateAuth, loginHR);

export default router;

