const CuentaBancaria = require('../models/CuentasBancaria');

exports.getAll = async (req, res, next) => {
  try {
    const cuentas = await CuentaBancaria.getAllCuentas();
    res.json(cuentas);
  } catch (err) {
    next(err);
  }
};

exports.getById = async (req, res, next) => {
  try {
    const cuenta = await CuentaBancaria.getCuentaById(req.params.id);
    if (!cuenta) return res.status(404).json({ error: 'Cuenta no encontrada' });
    res.json(cuenta);
  } catch (err) {
    next(err);
  }
};

exports.create = async (req, res, next) => {
  try {
    const cuenta = await CuentaBancaria.createCuenta(req.body);
    res.status(201).json(cuenta);
  } catch (err) {
    next(err);
  }
};

exports.update = async (req, res, next) => {
  try {
    const cuenta = await CuentaBancaria.updateCuenta(req.params.id, req.body);
    if (!cuenta) return res.status(404).json({ error: 'Cuenta no encontrada' });
    res.json(cuenta);
  } catch (err) {
    next(err);
  }
};

exports.delete = async (req, res, next) => {
  try {
    const cuenta = await CuentaBancaria.deleteCuenta(req.params.id);
    if (!cuenta) return res.status(404).json({ error: 'Cuenta no encontrada' });
    res.status(204).send();
  } catch (err) {
    next(err);
  }
};