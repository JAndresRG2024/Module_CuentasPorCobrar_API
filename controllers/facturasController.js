const Factura = require('../models/Factura');
const { enviarAuditoria } = require('../models/Auditoria');

exports.getFacturasNoPagadasPorCliente = async (req, res, next) => {
  try {
    const noPagadas = await Factura.getFacturasNoPagadasPorCliente(req.params.id_cliente);
    const resultado = noPagadas.map(f => ({
      id_cliente: f.id_cliente,
      id_factura: f.id_factura,
      numero_factura: f.numero_factura,
      estado_factura: f.estado_factura,
      nombre_cliente: f.nombre_cliente || '',
      monto_total: f.monto_total,
      iva: f.iva
    }));

    // Auditoría de consulta de facturas no pagadas
    await enviarAuditoria({
      accion: "SELECT",
      tabla: "facturas",
      id_usuario: req.usuario?.id_usuario || null,
      details: { tipo: "consulta facturas no pagadas", id_cliente: req.params.id_cliente },
      nombre_rol: req.usuario?.nombre_rol || "Sistema",
    });

    res.json(resultado);
  } catch (err) {
    next(err);
  }
};