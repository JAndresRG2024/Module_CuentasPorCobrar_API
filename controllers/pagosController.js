const Pago = require('../models/Pago');

exports.getAll = async (req, res, next) => {
  try {
    const pagos = await Pago.getAllPagos();
    res.json(pagos);
  } catch (err) {
    next(err);
  }
};

exports.getById = async (req, res, next) => {
  try {
    const pago = await Pago.getPagoById(req.params.id);
    if (!pago) return res.status(404).json({ error: 'Pago no encontrado' });
    res.json(pago);
  } catch (err) {
    next(err);
  }
};

exports.create = async (req, res, next) => {
  try {
    const pago = await Pago.createPago(req.body);
    res.status(201).json(pago);
  } catch (err) {
    next(err);
  }
};

exports.update = async (req, res, next) => {
  try {
    const pago = await Pago.updatePago(req.params.id, req.body);
    if (!pago) return res.status(404).json({ error: 'Pago no encontrado' });
    res.json(pago);
  } catch (err) {
    next(err);
  }
};

exports.delete = async (req, res, next) => {
  try {
    const pago = await Pago.deletePago(req.params.id);
    if (!pago) return res.status(404).json({ error: 'Pago no encontrado' });
    res.json({ message: 'Pago eliminado' });
  } catch (err) {
    next(err);
  }
};