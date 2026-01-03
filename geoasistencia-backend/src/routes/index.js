import { Router } from "express";
import authRoutes from "./auth.routes.js";
import adminRoutes from "./admin.routes.js";
import meRoutes from "./me.routes.js";
import sedesRoutes from "./sedes.routes.js"; 

const router = Router();

router.use("/auth", authRoutes);
router.use("/sedes", sedesRoutes);
router.use("/admin", adminRoutes);
router.use("/", meRoutes);

export default router;
