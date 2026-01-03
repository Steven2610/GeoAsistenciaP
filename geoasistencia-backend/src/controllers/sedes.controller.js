import { prisma } from "../prisma/client.js";

export async function listSedes(req, res, next) {
  try {
    const sedes = await prisma.sede.findMany({
      orderBy: { created_at: "desc" },
    });
    res.json(sedes);
  } catch (err) {
    next(err);
  }
}

export async function createSede(req, res, next) {
  try {
    const { nombre, direccion, latitud, longitud, radio_metros } = req.body;

    if (!nombre) return res.status(400).json({ ok: false, message: "Nombre requerido" });
    if (latitud === undefined || longitud === undefined)
      return res.status(400).json({ ok: false, message: "Latitud y longitud requeridas" });
    if (!radio_metros) return res.status(400).json({ ok: false, message: "Radio requerido" });

    const sede = await prisma.sede.create({
      data: {
        nombre,
        direccion: direccion || null,
        latitud,
        longitud,
        radio_metros: Number(radio_metros),
      },
    });

    res.status(201).json(sede);
  } catch (err) {
    next(err);
  }
}

export async function updateSede(req, res, next) {
  try {
    const { id } = req.params;
    const { nombre, direccion, latitud, longitud, radio_metros } = req.body;

    const sede = await prisma.sede.update({
      where: { id_sede: id },
      data: {
        ...(nombre !== undefined ? { nombre } : {}),
        ...(direccion !== undefined ? { direccion } : {}),
        ...(latitud !== undefined ? { latitud } : {}),
        ...(longitud !== undefined ? { longitud } : {}),
        ...(radio_metros !== undefined ? { radio_metros: Number(radio_metros) } : {}),
      },
    });

    res.json(sede);
  } catch (err) {
    next(err);
  }
}

export async function deleteSede(req, res, next) {
  try {
    const { id } = req.params;

    await prisma.sede.delete({
      where: { id_sede: id },
    });

    res.json({ ok: true });
  } catch (err) {
    next(err);
  }
}
