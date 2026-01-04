import { prisma } from "../prisma/client.js";

// ✅ Reporte con nombres ocultos por defecto
export const getReporteAsistencia = async (req, res) => {
  try {
    const { fechaDesde, fechaHasta, id_sede, id_usuario } = req.query;

    const whereClause = {
      ts_servidor: {
        gte: fechaDesde
          ? new Date(fechaDesde)
          : new Date(new Date().setDate(new Date().getDate() - 30)),
        lte: fechaHasta ? new Date(fechaHasta) : new Date(),
      },
    };

    if (id_sede && id_sede !== "all") whereClause.id_sede = id_sede;
    if (id_usuario && id_usuario !== "all") whereClause.id_usuario = id_usuario;

    const registros = await prisma.registro_asistencia.findMany({
      where: whereClause,
      include: {
        usuario: true, // No incluimos 'identidad' aquí para proteger la privacidad
        sede: true,
      },
      orderBy: { ts_servidor: "asc" },
    });

    const agrupados = {};
    registros.forEach((reg) => {
      const fecha = reg.ts_servidor.toISOString().split("T")[0];
      const key = `${reg.id_usuario}_${fecha}`;

      if (!agrupados[key]) {
        agrupados[key] = {
          id_usuario: reg.id_usuario,
          public_id: reg.usuario?.public_id || null, // ✅ código público
          email: reg.usuario?.email || null, // si quieres ocultar email, elimínalo aquí
          nombre: "PROTEGIDO (Requiere Auditoría)", // ✅ Privacidad por defecto
          sede: reg.sede?.nombre || null,
          fecha,
          entrada: null,
          salida: null,
          horas: 0,
        };
      }

      if (reg.tipo === "ENTRADA") agrupados[key].entrada = reg.ts_servidor;
      if (reg.tipo === "SALIDA") agrupados[key].salida = reg.ts_servidor;

      if (agrupados[key].entrada && agrupados[key].salida) {
        const diff =
          new Date(agrupados[key].salida) - new Date(agrupados[key].entrada);
        agrupados[key].horas = (diff / (1000 * 60 * 60)).toFixed(2);
      }
    });

    const dataArray = Object.values(agrupados);
    const kpis = {
      total: dataArray.length,
      completos: dataArray.filter((a) => a.entrada && a.salida).length,
      incompletos: dataArray.filter((a) => !a.entrada || !a.salida).length,
    };

    return res.json({ kpis, resultados: dataArray });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Error al generar reporte" });
  }
};

// ✅ Nueva función para revelar nombres en el reporte con auditoría
export const revelarNombresReporte = async (req, res) => {
  try {
    const actorId = req.user?.id || req.user?.id_usuario;
    const { motivo, ids_usuarios } = req.body;

    if (!actorId) {
      return res.status(401).json({ message: "No autenticado" });
    }

    if (!motivo || motivo.trim().length < 5) {
      return res
        .status(400)
        .json({ message: "Motivo de auditoría insuficiente" });
    }

    if (!Array.isArray(ids_usuarios) || ids_usuarios.length === 0) {
      return res
        .status(400)
        .json({ message: "ids_usuarios debe ser un array con al menos 1 id" });
    }

    // 🔒 (Opcional recomendado) Solo admin puede revelar:
    // if (req.user?.rol !== "ADMIN") {
    //   return res.status(403).json({ message: "No autorizado" });
    // }

    const identidades = await prisma.usuario_identidad.findMany({
      where: { id_usuario: { in: ids_usuarios } },
      select: { id_usuario: true, nombres: true, apellidos: true },
    });

    await prisma.audit_log.create({
      data: {
        actor_id_usuario: actorId,
        accion: "REVELAR_NOMBRES_REPORTE",
        target_tipo: "multiple_usuarios",
        target_id: "reporte_asistencia",
        motivo: motivo.trim(),
        ip: req.ip,
        user_agent: req.headers["user-agent"],
      },
    });

    return res.json({ ok: true, identidades });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Error al auditar y revelar nombres" });
  }
};

// ✅ Reporte de auditoría (NO revela nombres, solo logs de la acción)
export const getReporteAuditoria = async (req, res) => {
  try {
    // 🔒 (Opcional recomendado) Solo admin puede ver auditoría:
    // if (req.user?.rol !== "ADMIN") {
    //   return res.status(403).json({ message: "No autorizado" });
    // }

    const logs = await prisma.audit_log.findMany({
      where: { accion: "REVELAR_NOMBRES_REPORTE" },
      orderBy: { created_at: "desc" },
      take: 200,
    });

    return res.json({ total: logs.length, registros: logs });
  } catch (error) {
    console.error(error);
    return res
      .status(500)
      .json({ message: "Error al generar reporte de auditoría" });
  }
};
