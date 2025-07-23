const PagoDetalle = require('../models/PagoDetalle');
const { enviarAuditoria } = require('../models/Auditoria');

exports.getAll = async (req, res, next) => {
  try {
    const detalles = await PagoDetalle.getAllDetalles();
    await enviarAuditoria({
      accion: "SELECT",
      modulo: "cuentas por cobrar",
      tabla: "pagos_detalle",
      id_usuario: req.usuario?.id_usuario || null,
      details: { 
        tipo: "consulta general",
        consulta: 'SELECT * FROM pagos_detalle ORDER BY id_detalle',
        token: req.headers.authorization ? req.headers.authorization.split(' ')[1] : 'Sin token',
        usuario_autenticado: req.usuario?.usuario || 'Sin usuario autenticado'
      },
      nombre_rol: req.usuario?.nombre_rol || "Sistema",
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
      modulo: "cuentas por cobrar",
      tabla: "pagos_detalle",
      id_usuario: req.usuario?.id_usuario || null,
      details: { 
        tipo: "consulta individual", 
        id_detalle: req.params.id,
        consulta: `SELECT * FROM pagos_detalle WHERE id_detalle = ${req.params.id}`,
        token: req.headers.authorization ? req.headers.authorization.split(' ')[1] : 'Sin token',
        usuario_autenticado: req.usuario?.usuario || 'Sin usuario autenticado',
      },
      nombre_rol: req.usuario?.nombre_rol || "Sistema",
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
      modulo: "cuentas por cobrar",
      tabla: "pagos_detalle",
      id_usuario: req.usuario?.id_usuario || null,
      details: { 
        nuevo_detalle: detalle,
        consulta: 'INSERT INTO pagos_detalle',
        token: req.headers.authorization ? req.headers.authorization.split(' ')[1] : 'Sin token',
        usuario_autenticado: req.usuario?.usuario || 'Sin usuario autenticado'
      },
      nombre_rol: req.usuario?.nombre_rol || "Sistema",
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
      modulo: "cuentas por cobrar",
      tabla: "pagos_detalle",
      id_usuario: req.usuario?.id_usuario || null,
      details: { 
        id_detalle: req.params.id, 
        cambios: req.body,
        consulta: `UPDATE pagos_detalle SET ${Object.keys(req.body).map(key => `${key} = ?`).join(', ')} WHERE id_detalle = ${req.params.id}`,
        token: req.headers.authorization ? req.headers.authorization.split(' ')[1] : 'Sin token',
        usuario_autenticado: req.usuario?.usuario || 'Sin usuario autenticado'
      },
      nombre_rol: req.usuario?.nombre_rol || "Sistema",
    });
    res.json(detalle);
  } catch (err) {
    next(err);
  }
};

exports.delete = async (req, res, next) => {
  try {
    const detalle = await PagoDetalle.deleteDetalle(req.params.id);
    if (!detalle) {
      console.log(`No se encontró el detalle con id ${req.params.id}`);
      return res.status(404).json({ error: 'Detalle de pago no encontrado' });
    }
    await enviarAuditoria({
      accion: "DELETE",
      modulo: "cuentas por cobrar",
      tabla: "pagos_detalle",
      id_usuario: req.usuario?.id_usuario || null,
      details: { 
        id_detalle: req.params.id,
        consulta: `DELETE FROM pagos_detalle WHERE id_detalle = ${req.params.id}`,
        token: req.headers.authorization ? req.headers.authorization.split(' ')[1] : 'Sin token',
        usuario_autenticado: req.usuario?.usuario || 'Sin usuario autenticado'
      },
      nombre_rol: req.usuario?.nombre_rol || "Sistema",
    });
    res.json({ message: 'Detalle de pago eliminado' });
  } catch (err) {
    console.error('Error al eliminar detalle de pago:', err);
    next(err);
  }
};