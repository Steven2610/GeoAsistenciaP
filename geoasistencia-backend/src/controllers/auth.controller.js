import * as authService from "../services/auth.service.js";

function normalizeIdentidad(body) {
  if (body?.identidad && typeof body.identidad === "object") return body.identidad;

  const { nombres, apellidos, cedula, telefono, fecha_nacimiento } = body || {};
  const hasAny =
    (nombres && String(nombres).trim()) ||
    (apellidos && String(apellidos).trim()) ||
    (cedula && String(cedula).trim()) ||
    (telefono && String(telefono).trim()) ||
    (fecha_nacimiento && String(fecha_nacimiento).trim());

  if (!hasAny) return undefined;

  return {
    nombres: nombres?.trim?.() || undefined,
    apellidos: apellidos?.trim?.() || undefined,
    cedula: cedula?.trim?.() || undefined,
    telefono: telefono?.trim?.() || undefined,
    fecha_nacimiento: fecha_nacimiento || undefined,
  };
}

export const register = async (req, res, next) => {
  try {
    const identidad = normalizeIdentidad(req.body);
    const data = await authService.registerUser({ ...req.body, identidad });
    res.status(201).json({ ok: true, ...data });
  } catch (error) {
    next(error);
  }
};

export const login = async (req, res, next) => {
  try {
    const data = await authService.loginUser(req.body);
    res.json({ ok: true, ...data });
  } catch (error) {
    next(error);
  }
};

// Registro SOLO de empleado
export const registerEmpleado = async (req, res, next) => {
  try {
    const identidad = normalizeIdentidad(req.body);
    const data = await authService.registerUser({
      ...req.body,
      identidad,
      rol: "empleado",
    });
    res.status(201).json({ ok: true, ...data });
  } catch (error) {
    next(error);
  }
};
