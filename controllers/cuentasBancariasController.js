const CuentaBancaria = require('../models/CuentasBancaria');
const { enviarAuditoria } = require('../models/Auditoria');

exports.getAll = async (req, res, next) => {
  try {
    const cuentas = await CuentaBancaria.getAllCuentas();
    //Auditoría de consulta general
    await enviarAuditoria({
      accion: "SELECT",
      tabla: "cuentas_bancarias",
      id_usuario: req.usuario?.id || null,
      details: { tipo: "consulta general" },
      nombre_rol: req.usuario?.rol || "Sistema",
    });
    res.json(cuentas);
  } catch (err) {
    next(err);
  }
};

exports.getById = async (req, res, next) => {
  try {
    const cuenta = await CuentaBancaria.getCuentaById(req.params.id);
    if (!cuenta) return res.status(404).json({ error: 'Cuenta no encontrada' });
    // Auditoría de consulta individual
    await enviarAuditoria({
      accion: "SELECT",
      tabla: "cuentas_bancarias",
      id_usuario: req.usuario?.id || null,
      details: { tipo: "consulta individual", id_cuenta: req.params.id },
      nombre_rol: req.usuario?.rol || "Sistema",
    });
    res.json(cuenta);
  } catch (err) {
    next(err);
  }
};

exports.create = async (req, res, next) => {
  try {
    const cuenta = await CuentaBancaria.createCuenta(req.body);
    // Auditoría de creación
    await enviarAuditoria({
      accion: "INSERT",
      tabla: "cuentas_bancarias",
      id_usuario: req.usuario?.id || null,
      details: { nueva_cuenta: cuenta },
      nombre_rol: req.usuario?.rol || "Sistema",
    });
    res.status(201).json(cuenta);
  } catch (err) {
    next(err);
  }
};

exports.update = async (req, res, next) => {
  try {
    const cuenta = await CuentaBancaria.updateCuenta(req.params.id, req.body);
    if (!cuenta) return res.status(404).json({ error: 'Cuenta no encontrada' });
    // Auditoría de actualización
    await enviarAuditoria({
      accion: "UPDATE",
      tabla: "cuentas_bancarias",
      id_usuario: req.usuario?.id || null,
      details: { id_cuenta: req.params.id, cambios: req.body },
      nombre_rol: req.usuario?.rol || "Sistema",
    });
    res.json(cuenta);
  } catch (err) {
    next(err);
  }
};

exports.delete = async (req, res, next) => {
  try {
    const cuenta = await CuentaBancaria.deleteCuenta(req.params.id);
    if (!cuenta) return res.status(404).json({ error: 'Cuenta no encontrada' });
    // Auditoría de eliminación
    await enviarAuditoria({
      accion: "DELETE",
      tabla: "cuentas_bancarias",
      id_usuario: req.usuario?.id || null,
      details: { id_cuenta: req.params.id },
      nombre_rol: req.usuario?.rol || "Sistema",
    });
    res.status(204).send();
  } catch (err) {
    next(err);
  }
};