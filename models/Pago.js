const pool = require('../db');

const getAllPagos = async () => {
  // Trae pagos y sus detalles
  const pagosResult = await pool.query('SELECT * FROM pagos_cabecera ORDER BY id_pago DESC');
  const pagos = pagosResult.rows;

  const detallesResult = await pool.query(
    'SELECT * FROM pagos_detalle WHERE id_pago = ANY($1)',
    [pagos.map(p => p.id_pago)]
  );
  const detallesPorPago = {};
  detallesResult.rows.forEach(det => {
    if (!detallesPorPago[det.id_pago]) detallesPorPago[det.id_pago] = [];
    detallesPorPago[det.id_pago].push(det);
  });

  return pagos.map(pago => ({
    ...pago,
    detalles: detallesPorPago[pago.id_pago] || []
  }));
};

const createPago = async (pago) => {
  const { numero_pago, descripcion, fecha, id_cuenta, id_cliente, pdf_generado } = pago;
  const result = await pool.query(
    `INSERT INTO pagos_cabecera (numero_pago, descripcion, fecha, id_cuenta, id_cliente, pdf_generado)
     VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
    [numero_pago, descripcion, fecha, id_cuenta, id_cliente, pdf_generado || false]
  );
  return result.rows[0];
};

module.exports = {
  getAllPagos,
  createPago
};
