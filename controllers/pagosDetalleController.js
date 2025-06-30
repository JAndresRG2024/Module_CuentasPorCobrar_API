const PagoDetalle = require('../models/PagoDetalle');

exports.getAll = async (req, res, next) => {
  try {
    const detalles = await PagoDetalle.getAllDetalles();
    res.json(detalles);
  } catch (err) {
    next(err);
  }
};

exports.getById = async (req, res, next) => {
  try {
    const detalle = await PagoDetalle.getDetalleById(req.params.id);
    if (!detalle) return res.status(404).json({ error: 'Detalle de pago no encontrado' });
    res.json(detalle);
  } catch (err) {
    next(err);
  }
};

exports.create = async (req, res, next) => {
  try {
    const detalle = await PagoDetalle.createDetalle(req.body);
    res.status(201).json(detalle);
  } catch (err) {
    next(err);
  }
};

exports.update = async (req, res, next) => {
  try {
    const detalle = await PagoDetalle.updateDetalle(req.params.id, req.body);
    if (!detalle) return res.status(404).json({ error: 'Detalle de pago no encontrado' });
    res.json(detalle);
  } catch (err) {
    next(err);
  }
};

exports.delete = async (req, res, next) => {
  try {
    const detalle = await PagoDetalle.deleteDetalle(req.params.id);
    if (!detalle) return res.status(404).json({ error: 'Detalle de pago no encontrado' });
    res.json({ message: 'Detalle de pago eliminado' });
  } catch (err) {
    next(err);
  }
};