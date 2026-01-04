import { Router } from "express";
import { marcarAsistencia, listarHoy } from "../controllers/asistencia.controller.js";
import { requireAuth } from "../middlewares/auth.middleware.js";

const router = Router();

router.post("/marcar", requireAuth, marcarAsistencia);
router.get("/hoy", requireAuth, listarHoy);

export default router;

