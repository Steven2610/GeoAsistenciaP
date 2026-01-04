import { Router } from "express";

import authRoutes from "./auth.routes.js";
import adminRoutes from "./admin.routes.js";
import meRoutes from "./me.routes.js";
import sedesRoutes from "./sedes.routes.js";
import asistenciaRoutes from "./asistencia.routes.js";
import reportesRoutes from "./reportes.routes.js";

const router = Router();

router.use("/auth", authRoutes);
router.use("/sedes", sedesRoutes);
router.use("/admin", adminRoutes);
router.use("/", meRoutes);
router.use("/asistencia", asistenciaRoutes);
router.use("/reportes", reportesRoutes);

export default router;
