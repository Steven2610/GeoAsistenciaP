// src/routes/reportes.routes.js
import { Router } from "express";
import {
  getReporteAsistencia,
  getReporteAuditoria,
  revelarNombresReporte,
} from "../controllers/reportes.controller.js";
import { requireAuth } from "../middlewares/auth.middleware.js";

const router = Router();

// Reporte de asistencia (SIN nombres)
router.get("/asistencia", requireAuth, getReporteAsistencia);

// Reporte de auditoría (quién reveló identidades)
router.get("/auditoria", requireAuth, getReporteAuditoria);

// Revelar nombres SOLO con auditoría
router.post("/revelar-identidades", requireAuth, revelarNombresReporte);

export default router;
