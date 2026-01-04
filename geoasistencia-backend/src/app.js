import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import dotenv from "dotenv";
import routes from "./routes/index.js";
import { errorHandler, notFoundHandler } from "./middlewares/error.middleware.js";

dotenv.config();

const app = express();

app.use(helmet());

// ✅ CORS: Web (Render) + APK (Capacitor)
app.use(
  cors({
    origin: (origin, cb) => {
      const allowed = [
        process.env.CORS_ORIGIN, // tu web en Render (ej: https://geoasistenciap2.onrender.com)
        "capacitor://localhost", // APK Capacitor
        "http://localhost",      // algunos WebViews / fallback
      ].filter(Boolean);

      // ✅ Permite requests sin Origin (apps nativas / Postman)
      if (!origin) return cb(null, true);

      // ✅ Permite los orígenes autorizados
      if (allowed.includes(origin)) return cb(null, true);

      // ❌ Bloquea lo demás
      return cb(new Error(`CORS blocked: ${origin}`), false);
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

app.use(express.json({ limit: "1mb" }));
app.use(morgan("dev"));

app.get("/health", (_req, res) =>
  res.json({ ok: true, service: "geoasistencia-backend" })
);

app.use("/api", routes);

app.use(notFoundHandler);
app.use(errorHandler);

export default app;
