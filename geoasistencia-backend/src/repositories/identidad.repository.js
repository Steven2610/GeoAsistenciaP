import { prisma } from "../prisma/client.js";

export async function upsertIdentidad(id_usuario, identidad) {
  // fecha_nacimiento llega como string ISO, lo convertimos si existe
  const fecha = identidad?.fecha_nacimiento ? new Date(identidad.fecha_nacimiento) : undefined;

  return prisma.usuario_identidad.upsert({
    where: { id_usuario },
    update: {
      nombres: identidad.nombres,
      apellidos: identidad.apellidos,
      cedula: identidad.cedula,
      telefono: identidad.telefono,
      fecha_nacimiento: fecha
    },
    create: {
      id_usuario,
      nombres: identidad.nombres,
      apellidos: identidad.apellidos,
      cedula: identidad.cedula,
      telefono: identidad.telefono,
      fecha_nacimiento: fecha
    }
  });
}
