import { findUserWithSede } from "../repositories/usuario.repository.js";

export async function getMe(userId) {
  const user = await findUserWithSede(userId);
  if (!user) {
    const err = new Error("Usuario no existe");
    err.status = 404;
    throw err;
  }
  return user;
}
