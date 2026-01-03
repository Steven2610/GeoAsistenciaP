import { Router } from "express";
import { requireAuth } from "../middlewares/auth.middleware.js";
import { requireRole } from "../middlewares/role.middleware.js";
import {
  listSedes, // <--- Se llama listSedes
  createSede,
  updateSede,
  deleteSede,
} from "../controllers/sedes.controller.js";

const router = Router();

router.get('/', requireAuth, listSedes); 

// Rutas de administración (solo para admin)
router.post("/", requireAuth, requireRole("admin"), createSede);
router.put("/:id", requireAuth, requireRole("admin"), updateSede);
router.delete("/:id", requireAuth, requireRole("admin"), deleteSede);

export default router;