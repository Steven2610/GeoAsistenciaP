import { Router } from "express";
import { requireAuth } from "../middlewares/auth.middleware.js";
import { requireRole } from "../middlewares/role.middleware.js";

import {
  listUsuarios,
  createUsuario,
  updateUsuario,
  toggleEstadoUsuario,
  revelarIdentidad,
} from "../controllers/usuarios.controller.js";

const router = Router();

router.get("/ping", requireAuth, requireRole("admin"), (_req, res) => {
  res.json({ ok: true, message: "Solo admin ✅" });
});

// USUARIOS
router.get("/usuarios", requireAuth, requireRole("admin"), listUsuarios);
router.post("/usuarios", requireAuth, requireRole("admin"), createUsuario);
router.put("/usuarios/:id", requireAuth, requireRole("admin"), updateUsuario);
router.patch("/usuarios/:id/estado", requireAuth, requireRole("admin"), toggleEstadoUsuario);

// ✅ REVELAR IDENTIDAD
router.post("/usuarios/:id/identidad", requireAuth, requireRole("admin"), revelarIdentidad);

export default router;
