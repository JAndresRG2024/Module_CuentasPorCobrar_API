const Factura = require('../models/Factura');

exports.getFacturasNoPagadasPorCliente = async (req, res, next) => {
  try {
    const noPagadas = await Factura.getFacturasNoPagadasPorCliente(req.params.id_cliente);
    const resultado = noPagadas.map(f => ({
      id_cliente: f.id_cliente,
      id_factura: f.id_factura,
      estado_factura: f.estado_factura,
      nombre_cliente: f.nombre_cliente || '',
      monto_total: f.monto_total,
      iva: f.iva
    }));
    res.json(resultado);
  } catch (err) {
    next(err);
  }
};