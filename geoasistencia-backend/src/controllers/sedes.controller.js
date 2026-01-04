import { prisma } from "../prisma/client.js";

export async function listSedes(req, res, next) {
  try {
    // 1) Traer sedes (como ya lo haces)
    const sedes = await prisma.sede.findMany({
      orderBy: { created_at: "desc" },
    });

    // 2) Conteo "presentes hoy" por sede:
    //    - Tomamos el ÚLTIMO registro de HOY por usuario (DISTINCT ON)
    //    - Si ese último es ENTRADA => el usuario está presente
    const rows = await prisma.$queryRaw`
      WITH ult AS (
        SELECT DISTINCT ON (ra.id_usuario)
          ra.id_usuario,
          ra.id_sede,
          ra.tipo,
          ra.ts_servidor
        FROM registro_asistencia ra
        WHERE ra.ts_servidor >= date_trunc('day', now())
          AND ra.ts_servidor <  date_trunc('day', now()) + interval '1 day'
        ORDER BY ra.id_usuario, ra.ts_servidor DESC
      )
      SELECT
        id_sede,
        COUNT(*) FILTER (WHERE tipo = 'ENTRADA')::int AS presentes_hoy
      FROM ult
      GROUP BY id_sede;
    `;

    const map = new Map(rows.map((r) => [String(r.id_sede), Number(r.presentes_hoy)]));

    // 3) Unir al JSON final sin romper nada de lo existente
    const salida = sedes.map((s) => ({
      ...s,
      presentes_hoy: map.get(String(s.id_sede)) || 0,
    }));

    res.json(salida);
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
