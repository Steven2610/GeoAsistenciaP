import { Router } from "express";
import { requireAuth } from "../middlewares/auth.middleware.js";
import { requireRole } from "../middlewares/role.middleware.js";

const router = Router();

router.get("/ping", requireAuth, requireRole("admin"), (_req, res) => {
  res.json({ ok: true, message: "Solo admin ✅" });
});

export default router;
