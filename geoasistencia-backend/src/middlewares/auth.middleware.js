import jwt from "jsonwebtoken";
import { findUserById } from "../repositories/usuario.repository.js";

export async function requireAuth(req, res, next) {
  try {
    const header = req.headers.authorization || "";
    const token = header.startsWith("Bearer ") ? header.slice(7) : null;

    if (!token) {
      return res.status(401).json({ ok: false, message: "Token requerido" });
    }

    const payload = jwt.verify(token, process.env.JWT_SECRET);

    const user = await findUserById(payload.sub);
    if (!user) {
      return res.status(401).json({ ok: false, message: "Usuario no existe" });
    }

    req.user = {
      id: user.id_usuario,
      role: user.rol,
      public_id: user.public_id,
      email: user.email,
    };

    next();
  } catch (_err) {
    return res.status(401).json({ ok: false, message: "Token inválido o expirado" });
  }
}
