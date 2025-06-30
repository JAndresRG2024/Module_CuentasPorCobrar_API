const pool = require('../db');

const getAllCuentas = async () => {
  const result = await pool.query('SELECT * FROM cuentas_bancarias');
  return result.rows;
};

const getCuentaById = async (id) => {
  const result = await pool.query('SELECT * FROM cuentas_bancarias WHERE id_cuenta = $1', [id]);
  return result.rows[0];
};

const createCuenta = async (data) => {
  const { nombre_cuenta, entidad_bancaria, descripcion, estado } = data;
  const result = await pool.query(
    'INSERT INTO cuentas_bancarias (id_cuenta, nombre_cuenta, entidad_bancaria, descripcion, estado) VALUES (NULL, $1, $2, $3, $4) RETURNING *',
    [nombre_cuenta, entidad_bancaria, descripcion, estado]
  );
  return result.rows[0];
};

const updateCuenta = async (id, data) => {
  const { nombre_cuenta, entidad_bancaria, descripcion, estado } = data;
  const result = await pool.query(
    'UPDATE cuentas_bancarias SET nombre_cuenta=$1, entidad_bancaria=$2, descripcion=$3, estado=$4 WHERE id_cuenta=$5 RETURNING *',
    [nombre_cuenta, entidad_bancaria, descripcion, estado, id]
  );
  return result.rows[0];
};

const deleteCuenta = async (id) => {
  const result = await pool.query('DELETE FROM cuentas_bancarias WHERE id_cuenta = $1 RETURNING *', [id]);
  return result.rows[0];
};

module.exports = {
  getAllCuentas,
  getCuentaById,
  createCuenta,
  updateCuenta,
  deleteCuenta,
};