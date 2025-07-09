const PagoDetalle = require('../models/PagoDetalle');
const { enviarAuditoria } = require('../models/Auditoria');

exports.getAll = async (req, res, next) => {
  try {
    const detalles = await PagoDetalle.getAllDetalles();
    await enviarAuditoria({
      accion: "SELECT",
      tabla: "pagos_detalle",
      id_usuario: req.usuario?.id || null,
      details: { tipo: "consulta general" },
      nombre_rol: req.usuario?.rol || "Sistema",
    });
    res.json(detalles);
  } catch (err) {
    next(err);
  }
};

exports.getById = async (req, res, next) => {
  try {
    const detalle = await PagoDetalle.getDetalleById(req.params.id);
    if (!detalle) return res.status(404).json({ error: 'Detalle de pago no encontrado' });
    await enviarAuditoria({
      accion: "SELECT",
      tabla: "pagos_detalle",
      id_usuario: req.usuario?.id || null,
      details: { tipo: "consulta individual", id_detalle: req.params.id },
      nombre_rol: req.usuario?.rol || "Sistema",
    });
    res.json(detalle);
  } catch (err) {
    next(err);
  }
};

exports.create = async (req, res, next) => {
  try {
    const detalle = await PagoDetalle.createDetalle(req.body);
    await enviarAuditoria({
      accion: "INSERT",
      tabla: "pagos_detalle",
      id_usuario: req.usuario?.id || null,
      details: { nuevo_detalle: detalle },
      nombre_rol: req.usuario?.rol || "Sistema",
    });
    res.status(201).json(detalle);
  } catch (err) {
    next(err);
  }
};

exports.update = async (req, res, next) => {
  try {
    const detalle = await PagoDetalle.updateDetalle(req.params.id, req.body);
    if (!detalle) return res.status(404).json({ error: 'Detalle de pago no encontrado' });
    await enviarAuditoria({
      accion: "UPDATE",
      tabla: "pagos_detalle",
      id_usuario: req.usuario?.id || null,
      details: { id_detalle: req.params.id, cambios: req.body },
      nombre_rol: req.usuario?.rol || "Sistema",
    });
    res.json(detalle);
  } catch (err) {
    next(err);
  }
};

exports.delete = async (req, res, next) => {
  try {
    const detalle = await PagoDetalle.deleteDetalle(req.params.id);
    if (!detalle) return res.status(404).json({ error: 'Detalle de pago no encontrado' });
    await enviarAuditoria({
      accion: "DELETE",
      tabla: "pagos_detalle",
      id_usuario: req.usuario?.id || null,
      details: { id_detalle: req.params.id },
      nombre_rol: req.usuario?.rol || "Sistema",
    });
    res.json({ message: 'Detalle de pago eliminado' });
  } catch (err) {
    next(err);
  }
};