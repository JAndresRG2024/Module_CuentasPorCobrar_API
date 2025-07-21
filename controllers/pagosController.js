const Pago = require('../models/Pago');
const { enviarAuditoria } = require('../models/Auditoria');

exports.getAll = async (req, res, next) => {
  try {
    const pagos = await Pago.getAllPagos();
    await enviarAuditoria({
      accion: "SELECT",
      tabla: "pagos",
      id_usuario: req.usuario?.id_usuario || null,
      details: { tipo: "consulta general" },
      nombre_rol: req.usuario?.nombre_rol || "Sistema",
    });
    res.json(pagos);
  } catch (err) {
    next(err);
  }
};

exports.getById = async (req, res, next) => {
  try {
    const pago = await Pago.getPagoById(req.params.id);
    if (!pago) return res.status(404).json({ error: 'Pago no encontrado' });
    await enviarAuditoria({
      accion: "SELECT",
      tabla: "pagos",
      id_usuario: req.usuario?.id_usuario || null,
      details: { tipo: "consulta individual", id_pago: req.params.id },
      nombre_rol: req.usuario?.nombre_rol || "Sistema",
    });
    res.json(pago);
  } catch (err) {
    next(err);
  }
};

exports.create = async (req, res, next) => {
  try {
    const pago = await Pago.createPago(req.body);
    await enviarAuditoria({
      accion: "INSERT",
      tabla: "pagos",
      id_usuario: req.usuario?.id_usuario || null,
      details: { nuevo_pago: pago },
      nombre_rol: req.usuario?.nombre_rol || "Sistema",
    });
    res.status(201).json(pago);
  } catch (err) {
    next(err);
  }
};

exports.update = async (req, res, next) => {
  try {
    const pago = await Pago.updatePago(req.params.id, req.body);
    if (!pago) return res.status(404).json({ error: 'Pago no encontrado' });
    await enviarAuditoria({
      accion: "UPDATE",
      tabla: "pagos",
      id_usuario: req.usuario?.id_usuario || null,
      details: { id_pago: req.params.id, cambios: req.body },
      nombre_rol: req.usuario?.nombre_rol || "Sistema",
    });
    res.json(pago);
  } catch (err) {
    next(err);
  }
};

exports.delete = async (req, res, next) => {
  try {
    const pago = await Pago.deletePago(req.params.id);
    if (!pago) return res.status(404).json({ error: 'Pago no encontrado' });
    await enviarAuditoria({
      accion: "DELETE",
      tabla: "pagos",
      id_usuario: req.usuario?.id_usuario || null,
      details: { id_pago: req.params.id },
      nombre_rol: req.usuario?.nombre_rol || "Sistema",
    });
    res.json({ message: 'Pago eliminado' });
  } catch (err) {
    next(err);
  }
};

exports.descargarPDF = async (req, res, next) => {
  try {
    await Pago.generarPDFPago(req.params.id, res, req.usuario || {});
    // en el modelo se envía auditoría de descarga
  } catch (err) {
    next(err);
  }
};

exports.descargarReportePagos = async (req, res, next) => {
  try {
    await Pago.generarReportePagosPDF(res, req.usuario || {});
    // en el modelo se envía auditoría de descarga
  } catch (err) {
    next(err);
  }
};