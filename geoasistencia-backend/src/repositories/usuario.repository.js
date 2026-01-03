import { prisma } from "../prisma/client.js";

/**
 * Repositorio de Usuario
 * Arregla exports faltantes que rompían:
 * - register/login (findUserByEmail, createUser)
 * - requireAuth (findUserById)
 * - /me (findUserWithSede)
 */

export async function findUserByEmail(email) {
  return prisma.usuario.findUnique({
    where: { email },
    include: { identidad: true, sede: true },
  });
}

export async function findUserById(id_usuario) {
  return prisma.usuario.findUnique({
    where: { id_usuario },
    include: { identidad: true, sede: true },
  });
}

export async function findUserWithSede(id_usuario) {
  return prisma.usuario.findUnique({
    where: { id_usuario },
    include: { identidad: true, sede: true },
  });
}

export async function createUser({
  public_id,
  email,
  password_hash,
  rol = "empleado",
  estado = "activo",
  id_sede_asignada = null,
  identidad = null,
}) {
  return prisma.usuario.create({
    data: {
      public_id,
      email,
      password_hash,
      rol,
      estado,
      id_sede_asignada,
      identidad: identidad ? { create: { ...identidad } } : undefined,
    },
    include: { identidad: true, sede: true },
  });
}
