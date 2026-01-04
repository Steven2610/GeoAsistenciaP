import { prisma } from "../prisma/client.js";

function inicioDia(d = new Date()) {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}
function finDia(d = new Date()) {
  const x = new Date(d);
  x.setHours(23, 59, 59, 999);
  return x;
}

export async function marcarAsistencia(req, res) {
  try {
    const id_usuario = req.user.id; // requireAuth

    const {
      id_sede,
      tipo,
      latitud,
      longitud,
      dentro_geocerca,
      device_id,
      auto, // opcional: true si fue auto-salida
    } = req.body;

    if (!id_sede || !tipo || latitud == null || longitud == null) {
      return res.status(400).json({ message: "Datos incompletos" });
    }

    if (!["ENTRADA", "SALIDA"].includes(tipo)) {
      return res.status(400).json({ message: "Tipo inválido" });
    }

    // ✅ Reglas por día (recomendado) para que no te afecte “ayer”
    const inicio = inicioDia();
    const fin = finDia();

    // 🔎 Último registro del usuario (DE HOY)
    const ultimo = await prisma.registro_asistencia.findFirst({
      where: {
        id_usuario,
        ts_servidor: { gte: inicio, lte: fin },
      },
      orderBy: { ts_servidor: "desc" },
      select: { tipo: true, ts_servidor: true, id_sede: true },
    });

    const estaDentro = ultimo?.tipo === "ENTRADA";

    // ✅ Reglas de secuencia (sin dañar tu lógica)
    if (estaDentro && tipo === "ENTRADA") {
      return res.status(409).json({
        message: "Ya tienes una ENTRADA activa. Debes marcar SALIDA primero.",
      });
    }

    if ((!ultimo || ultimo?.tipo === "SALIDA") && tipo === "SALIDA") {
      return res.status(409).json({
        message: "No puedes marcar SALIDA sin una ENTRADA previa.",
      });
    }

    // ✅ NUEVO: Evitar cambiar de sede estando “dentro”
    // Si tu último estado hoy es ENTRADA en otra sede, primero debes marcar SALIDA en esa misma sede.
    if (tipo === "ENTRADA" && estaDentro && ultimo?.id_sede && ultimo.id_sede !== id_sede) {
      return res.status(409).json({
        message: "Ya estás dentro de otra sede. Marca SALIDA primero antes de ingresar a una sede diferente.",
      });
    }

    // ✅ NUEVO (opcional): si es SALIDA, puedes forzar que sea en la misma sede de la ENTRADA activa
    // Esto evita “SALIDA” en sede equivocada.
    if (tipo === "SALIDA" && estaDentro && ultimo?.id_sede && ultimo.id_sede !== id_sede) {
      return res.status(409).json({
        message: "Debes marcar SALIDA en la misma sede donde marcaste ENTRADA.",
      });
    }

    // 🔒 FIX P2000 (device_id largo)
    const safeDeviceId = (device_id || "").slice(0, 120);

    const registro = await prisma.registro_asistencia.create({
      data: {
        id_usuario,
        id_sede,
        tipo,
        ts_servidor: new Date(),
        latitud,
        longitud,
        dentro_geocerca: Boolean(dentro_geocerca),
        fuente: "ONLINE",
        device_id: safeDeviceId || null,
        // Si luego quieres guardar el "auto" en BD, aquí necesitarías un campo (no existe en tu schema actual)
        // auto: Boolean(auto)  <-- NO lo pongo para no dañar tu BD
      },
      select: {
        id_registro: true,
        tipo: true,
        ts_servidor: true,
      },
    });

    return res.status(201).json(registro);
  } catch (error) {
    console.error("marcarAsistencia:", error);
    return res.status(500).json({ message: "Error al registrar asistencia" });
  }
}

export async function listarHoy(req, res) {
  try {
    const id_usuario = req.user.id;

    const inicio = new Date();
    inicio.setHours(0, 0, 0, 0);

    const fin = new Date();
    fin.setHours(23, 59, 59, 999);

    const registros = await prisma.registro_asistencia.findMany({
      where: { id_usuario, ts_servidor: { gte: inicio, lte: fin } },
      orderBy: { ts_servidor: "desc" },
      include: { sede: { select: { nombre: true } } },
      take: 50,
    });

    return res.json(
      registros.map((r) => ({
        tipo: r.tipo,
        sede: r.sede?.nombre || "—",
        ts_servidor: r.ts_servidor,
      }))
    );
  } catch (error) {
    console.error("listarHoy:", error);
    return res.status(500).json({ message: "Error al listar registros" });
  }
}
