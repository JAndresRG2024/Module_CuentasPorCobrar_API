const pool = require('../db');

const getAllDetalles = async () => {
  const result = await pool.query('SELECT * FROM pagos_detalle');
  return result.rows;
};

const getDetalleById = async (id) => {
  const result = await pool.query('SELECT * FROM pagos_detalle WHERE id_detalle = $1', [id]);
  return result.rows[0];
};

const createDetalle = async (data) => {
  const { id_pago, id_factura, monto_pagado } = data;
  const result = await pool.query(
    'INSERT INTO pagos_detalle (id_pago, id_factura, monto_pagado) VALUES ($1, $2, $3) RETURNING *',
    [id_pago, id_factura, monto_pagado]
  );
  return result.rows[0];
};

const updateDetalle = async (id, data) => {
  const { id_pago, id_factura, monto_pagado } = data;
  const result = await pool.query(
    'UPDATE pagos_detalle SET id_pago = $1, id_factura = $2, monto_pagado = $3 WHERE id_detalle = $4 RETURNING *',
    [id_pago, id_factura, monto_pagado, id]
  );
  return result.rows[0];
};

const deleteDetalle = async (id) => {
  const result = await pool.query('DELETE FROM pagos_detalle WHERE id_detalle = $1 RETURNING *', [id]);
  return result.rows[0];
};

module.exports = {
  getAllDetalles,
  getDetalleById,
  createDetalle,
  updateDetalle,
  deleteDetalle,
};