import { Router } from "express";
import { register, login, registerEmpleado } from "../controllers/auth.controller.js";

const router = Router();

router.post("/register", register);
router.post("/login", login);
router.post("/register-empleado", registerEmpleado);

export default router;