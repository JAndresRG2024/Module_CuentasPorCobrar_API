const pool = require('../db');

const getAllPagos = async () => {
  const pagosResult = await pool.query('SELECT * FROM pagos ORDER BY id_pago DESC');
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

const getPagoById = async (id) => {
  const pagoResult = await pool.query('SELECT * FROM pagos WHERE id_pago = $1', [id]);
  if (pagoResult.rows.length === 0) return null;
  const pago = pagoResult.rows[0];
  const detallesResult = await pool.query('SELECT * FROM pagos_detalle WHERE id_pago = $1', [id]);
  pago.detalles = detallesResult.rows;
  return pago;
};

const createPago = async (data) => {
  const { numero_pago, descripcion, fecha, id_cuenta, id_cliente, pdf_generado } = data;
  const result = await pool.query(
    `INSERT INTO pagos (numero_pago, descripcion, fecha, id_cuenta, id_cliente, pdf_generado)
     VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
    [numero_pago, descripcion, fecha, id_cuenta, id_cliente, pdf_generado || false]
  );
  return result.rows[0];
};

const updatePago = async (id, data) => {
  const { numero_pago, descripcion, fecha, id_cuenta, id_cliente, pdf_generado } = data;
  const result = await pool.query(
    `UPDATE pagos SET
      numero_pago = $1,
      descripcion = $2,
      fecha = $3,
      id_cuenta = $4,
      id_cliente = $5,
      pdf_generado = $6
     WHERE id_pago = $7 RETURNING *`,
    [numero_pago, descripcion, fecha, id_cuenta, id_cliente, pdf_generado, id]
  );
  return result.rows[0];
};

const deletePago = async (id) => {
  const result = await pool.query('DELETE FROM pagos WHERE id_pago = $1 RETURNING *', [id]);
  return result.rows[0];
};

module.exports = {
  getAllPagos,
  getPagoById,
  createPago,
  updatePago,
  deletePago,
};