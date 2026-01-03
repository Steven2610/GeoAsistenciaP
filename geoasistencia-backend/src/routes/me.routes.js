import { Router } from "express";
import { requireAuth } from "../middlewares/auth.middleware.js";
import { me } from "../controllers/me.controller.js";

const router = Router();

router.get("/me", requireAuth, me);

export default router;
