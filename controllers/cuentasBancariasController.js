const CuentaBancaria = require('../models/CuentasBancaria');
const { enviarAuditoria } = require('../models/Auditoria');

exports.getAll = async (req, res, next) => {
  try {
    const cuentas = await CuentaBancaria.getAllCuentas();
    //Auditoría de consulta general
    await enviarAuditoria({
      accion: "SELECT",
      modulo: "cuentas por cobrar",
      tabla: "cuentas_bancarias",
      id_usuario: req.usuario?.id_usuario || null,
      details: { 
        consulta: 'SELECT * FROM cuentas_bancarias ORDER BY id_cuenta',
        token: req.headers.authorization ? req.headers.authorization.split(' ')[1] : 'Sin token',
        usuario_autenticado: req.usuario?.usuario || 'Sin usuario autenticado' 
      },
      nombre_rol: req.usuario?.nombre_rol || "Sistema",
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
      modulo: "cuentas por cobrar",
      tabla: "cuentas_bancarias",
      id_usuario: req.usuario?.id_usuario || null,
      details: { 
        consulta: `SELECT * FROM cuentas_bancarias WHERE id_cuenta = ${req.params.id}`,
        token: req.headers.authorization ? req.headers.authorization.split(' ')[1] : 'Sin token',
        usuario_autenticado: req.usuario?.usuario || 'Sin usuario autenticado'
      },
      nombre_rol: req.usuario?.nombre_rol || "Sistema",
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
      modulo: "cuentas por cobrar",
      tabla: "cuentas_bancarias",
      id_usuario: req.usuario?.id_usuario || null,
      details: { 
        id_cuenta: cuenta.id_cuenta,
        datos: req.body,
        consulta: 'INSERT INTO cuentas_bancarias',
        token: req.headers.authorization ? req.headers.authorization.split(' ')[1] : 'Sin token',
        usuario_autenticado: req.usuario?.usuario || 'Sin usuario autenticado'
      },
      nombre_rol: req.usuario?.nombre_rol || "Sistema",
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
      modulo: "cuentas por cobrar",
      tabla: "cuentas_bancarias",
      id_usuario: req.usuario?.id_usuario || null,
      details: { 
        id_cuenta: req.params.id, cambios: req.body, 
        consulta: `UPDATE cuentas_bancarias SET ${Object.keys(req.body).map(key => `${key} = ?`).join(', ')} WHERE id_cuenta = ${req.params.id}`,
        token: req.headers.authorization ? req.headers.authorization.split(' ')[1] : 'Sin token',
        usuario_autenticado: req.usuario?.usuario || 'Sin usuario autenticado'
        },
      nombre_rol: req.usuario?.nombre_rol || "Sistema",
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
      modulo: "cuentas por cobrar",
      tabla: "cuentas_bancarias",
      id_usuario: req.usuario?.id_usuario || null,
      details: { 
        id_cuenta: req.params.id,
        consulta: `DELETE FROM cuentas_bancarias WHERE id_cuenta = ${req.params.id}`,
        token: req.headers.authorization ? req.headers.authorization.split(' ')[1] : 'Sin token',
        usuario_autenticado: req.usuario?.usuario || 'Sin usuario autenticado'
      },
      nombre_rol: req.usuario?.nombre_rol || "Sistema",
    });
    res.status(204).send();
  } catch (err) {
    next(err);
  }
};