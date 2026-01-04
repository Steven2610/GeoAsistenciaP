import { prisma } from "../prisma/client.js";
import bcrypt from "bcryptjs";

/**
 * Activo hoy = su ÚLTIMO registro de HOY es ENTRADA.
 * ✅ Extra: ultima_accion_hoy = "ENTRADA" | "SALIDA" | null
 */
export async function listUsuarios(req, res) {
  try {
    const rows = await prisma.$queryRaw`
      WITH last_reg AS (
        SELECT DISTINCT ON (ra.id_usuario)
          ra.id_usuario,
          ra.tipo,
          ra.ts_servidor
        FROM registro_asistencia ra
        WHERE ra.ts_servidor >= date_trunc('day', now())
          AND ra.ts_servidor <  date_trunc('day', now()) + interval '1 day'
        ORDER BY ra.id_usuario, ra.ts_servidor DESC
      )
      SELECT
        u.id_usuario,
        u.public_id,
        u.email,
        u.rol,
        u.estado,
        u.id_sede_asignada,
        s.nombre AS sede_nombre,
        (lr.tipo = 'ENTRADA') AS activo_hoy,
        lr.tipo AS ultima_accion_hoy,
        lr.ts_servidor AS ultimo_registro_hoy
      FROM usuario u
      LEFT JOIN sede s ON s.id_sede = u.id_sede_asignada
      LEFT JOIN last_reg lr ON lr.id_usuario = u.id_usuario
      ORDER BY u.created_at DESC;
    `;

    const totalUsuarios = rows.length;
    const activosHoy = rows.reduce((acc, r) => acc + (r.activo_hoy ? 1 : 0), 0);
    const totalAdmins = rows.reduce((acc, r) => acc + (String(r.rol) === "admin" ? 1 : 0), 0);
    const totalEmpleados = rows.reduce((acc, r) => acc + (String(r.rol) === "empleado" ? 1 : 0), 0);

    res.json({
      kpis: { totalUsuarios, activosHoy, totalAdmins, totalEmpleados },
      usuarios: rows.map((r) => ({
        id_usuario: r.id_usuario,
        public_id: r.public_id,
        email: r.email,
        rol: r.rol,
        estado: r.estado,
        id_sede_asignada: r.id_sede_asignada,
        sede_nombre: r.sede_nombre || "—",

        // lo mantenemos para no romper tu UI si aún lo usas
        activo_hoy: Boolean(r.activo_hoy),
        ultimo_registro_hoy: r.ultimo_registro_hoy || null,

        // ✅ nuevo
        ultima_accion_hoy: r.ultima_accion_hoy || null,
      })),
    });
  } catch (error) {
    console.error("listUsuarios:", error);
    return res.status(500).json({ message: "Error al listar usuarios" });
  }
}

export async function createUsuario(req, res) {
  try {
    const {
      public_id,
      email,
      password,
      rol = "empleado",
      estado = "activo",
      id_sede_asignada = null,
      // Nuevos campos de identidad
      nombres,
      apellidos,
      cedula,
      telefono
    } = req.body;

    if (!public_id || !email || !password || !nombres || !apellidos) {
      return res.status(400).json({ message: "Faltan campos obligatorios (ID, Email, Password, Nombres, Apellidos)" });
    }

    const password_hash = await bcrypt.hash(String(password), 10);

    // ✅ Uso de transacción para crear ambos registros
    const result = await prisma.$transaction(async (tx) => {
      const user = await tx.usuario.create({
        data: {
          public_id: String(public_id).trim(),
          email: String(email).trim().toLowerCase(),
          password_hash,
          rol,
          estado,
          id_sede_asignada: id_sede_asignada || null,
        },
      });

      await tx.usuario_identidad.create({
        data: {
          id_usuario: user.id_usuario,
          nombres: String(nombres).trim(),
          apellidos: String(apellidos).trim(),
          cedula: cedula ? String(cedula).trim() : null,
          telefono: telefono ? String(telefono).trim() : null,
        },
      });

      return user;
    });

    return res.status(201).json(result);
  } catch (error) {
    console.error("createUsuario error:", error);
    if (error?.code === "P2002") {
      return res.status(409).json({ message: "Ya existe un usuario con ese public_id o email" });
    }
    return res.status(500).json({ message: "Error al crear usuario e identidad" });
  }
}

export async function updateUsuario(req, res) {
  try {
    const { id } = req.params;
    const { email, rol, estado, id_sede_asignada } = req.body;

    const data = {};
    if (email !== undefined) data.email = String(email).trim().toLowerCase();
    if (rol !== undefined) {
      if (!["admin", "empleado"].includes(rol)) return res.status(400).json({ message: "Rol inválido" });
      data.rol = rol;
    }
    if (estado !== undefined) {
      if (!["activo", "inactivo"].includes(estado)) return res.status(400).json({ message: "Estado inválido" });
      data.estado = estado;
    }
    if (id_sede_asignada !== undefined) data.id_sede_asignada = id_sede_asignada || null;

    const user = await prisma.usuario.update({
      where: { id_usuario: id },
      data,
      select: {
        id_usuario: true,
        public_id: true,
        email: true,
        rol: true,
        estado: true,
        id_sede_asignada: true,
      },
    });

    return res.json(user);
  } catch (error) {
    console.error("updateUsuario:", error);
    if (error?.code === "P2002") return res.status(409).json({ message: "Email ya está en uso" });
    return res.status(500).json({ message: "Error al actualizar usuario" });
  }
}

export async function toggleEstadoUsuario(req, res) {
  try {
    const { id } = req.params;

    // 1. Buscar el estado actual
    const current = await prisma.usuario.findUnique({
      where: { id_usuario: id },
      select: { estado: true },
    });

    if (!current) return res.status(404).json({ message: "Usuario no encontrado" });

    // 2. Invertir el estado
    const nuevoEstado = current.estado === "activo" ? "inactivo" : "activo";

    // 3. Actualizar
    const userUpdated = await prisma.usuario.update({
      where: { id_usuario: id },
      data: { estado: nuevoEstado },
      select: {
        id_usuario: true,
        public_id: true,
        estado: true,
      },
    });

    return res.json(userUpdated);
  } catch (error) {
    console.error("Error en toggleEstado:", error);
    return res.status(500).json({ message: "No se pudo cambiar el estado" });
  }
}

/**
 * ✅ Revelar identidad (solo admin)
 * - body: { motivo }
 * - guarda SIEMPRE audit_log
 */
export async function revelarIdentidad(req, res) {
  try {
    const actorId = req.user?.id || req.user?.id_usuario;
    const { id } = req.params;
    
    // ✅ Extraemos el motivo y nos aseguramos de que sea un String
    const { motivo } = req.body;
    const motivoFinal = typeof motivo === 'object' ? motivo.motivo : motivo;

    if (!actorId) return res.status(401).json({ message: "No autenticado" });

    // ✅ Usamos motivoFinal para la validación
    if (!motivoFinal || String(motivoFinal).trim().length < 5) {
      return res.status(400).json({ message: "Motivo requerido (mínimo 5 caracteres)" });
    }

    const identidad = await prisma.usuario_identidad.findUnique({
      where: { id_usuario: id }
    });

    await prisma.audit_log.create({
      data: {
        actor_id_usuario: actorId,
        accion: "REVELAR_IDENTIDAD",
        target_tipo: "usuario",
        target_id: id,
        motivo: String(motivoFinal).trim().slice(0, 255), // ✅ Guardamos texto puro
        ip: req.ip || null,
        user_agent: req.headers["user-agent"] || null,
      },
    });

    return res.json({ ok: true, identidad: identidad || null });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Error interno del servidor" });
  }
}
