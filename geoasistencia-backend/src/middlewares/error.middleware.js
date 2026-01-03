export function notFoundHandler(req, res, _next) {
  res.status(404).json({ ok: false, message: `Ruta no encontrada: ${req.method} ${req.originalUrl}` });
}

export function errorHandler(err, _req, res, _next) {
  const status = err.status || 500;
  res.status(status).json({
    ok: false,
    message: err.message || "Error interno",
    details: err.details || undefined
  });
}
