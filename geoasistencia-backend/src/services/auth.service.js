import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { createUser, findUserByEmail } from "../repositories/usuario.repository.js";
import { upsertIdentidad } from "../repositories/identidad.repository.js";

function assertEnv() {
  if (!process.env.JWT_SECRET) {
    const err = new Error("Falta JWT_SECRET en .env");
    err.status = 500;
    throw err;
  }
}

function signToken(user) {
  assertEnv();
  const expiresIn = process.env.JWT_EXPIRES_IN || "8h";

  // sub = id_usuario
  return jwt.sign(
    { role: user.rol, public_id: user.public_id },
    process.env.JWT_SECRET,
    { subject: user.id_usuario, expiresIn }
  );
}

export async function registerUser({ public_id, email, password, rol = "empleado", identidad }) {
  if (!public_id || !email || !password) {
    const err = new Error("public_id, email y password son obligatorios");
    err.status = 400;
    throw err;
  }

  const existing = await findUserByEmail(String(email).trim().toLowerCase());
  if (existing) {
    const err = new Error("El email ya está registrado");
    err.status = 409;
    throw err;
  }

  const password_hash = await bcrypt.hash(password, 10);

  let user;
  try {
    user = await createUser({
      public_id: String(public_id).trim(),
      email: String(email).trim().toLowerCase(),
      password_hash,
      rol,
      estado: "activo",
      identidad: identidad || null,
    });
  } catch (e) {
    const msg = String(e?.message || "");
    if (msg.includes("Unique constraint")) {
      const err = new Error("Ya existe un usuario con ese email o public_id");
      err.status = 409;
      throw err;
    }
    throw e;
  }

  if (identidad) {
    await upsertIdentidad(user.id_usuario, identidad);
  }

  const token = signToken(user);
  return {
    token,
    user: {
      id_usuario: user.id_usuario,
      public_id: user.public_id,
      email: user.email,
      rol: user.rol,
    },
  };
}

export async function loginUser({ email, password }) {
  if (!email || !password) {
    const err = new Error("email y password son obligatorios");
    err.status = 400;
    throw err;
  }

  const user = await findUserByEmail(String(email).trim().toLowerCase());
  if (!user) {
    const err = new Error("Credenciales inválidas");
    err.status = 401;
    throw err;
  }

  if (user.estado !== "activo") {
    const err = new Error("Usuario inactivo");
    err.status = 403;
    throw err;
  }

  const ok = await bcrypt.compare(password, user.password_hash);
  if (!ok) {
    const err = new Error("Credenciales inválidas");
    err.status = 401;
    throw err;
  }

  const token = signToken(user);
  return {
    token,
    user: {
      id_usuario: user.id_usuario,
      public_id: user.public_id,
      email: user.email,
      rol: user.rol,
    },
  };
}
