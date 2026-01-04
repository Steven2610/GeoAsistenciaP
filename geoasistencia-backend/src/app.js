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

app.use(cors({
  origin: true, // ✅ permite web + móvil
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE"],
  allowedHeaders: ["Content-Type", "Authorization"]
}));

app.use(express.json({ limit: "1mb" }));
app.use(morgan("dev"));

app.get("/health", (_req, res) =>
  res.json({ ok: true, service: "geoasistencia-backend" })
);

app.use("/api", routes);

app.use(notFoundHandler);
app.use(errorHandler);

export default app;
