import { Router } from "express";
import { processChat } from "./controller/chatbot.controller.js";
import validation from "../../middleWare/validation.js";
import { chatSchema } from "./chatbot.validation.js";
const router = Router();

router.post("/chat", processChat);

export default router;
