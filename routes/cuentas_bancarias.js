const express = require('express');
const router = express.Router();
const pool = require('../db');

/**
 * @swagger
 * tags:
 *   name: Cuentas Bancarias
 *   description: Endpoints para la gestión de cuentas bancarias
 */

/**
 * @swagger
 * /api/cuentas:
 *   get:
 *     summary: Obtener todas las cuentas bancarias
 *     tags: [Cuentas Bancarias]
 *     responses:
 *       200:
 *         description: Lista de cuentas bancarias
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   id_cuenta:
 *                     type: string
 *                   nombre_cuenta:
 *                     type: string
 *                   entidad_bancaria:
 *                     type: string
 *                   descripcion:
 *                     type: string
 *                   estado:
 *                     type: boolean
 */
router.get('/', async (req, res, next) => {
  try {
    const result = await pool.query('SELECT * FROM cuentas_bancarias');
    res.json(result.rows);
  } catch (err) {
    next(err);
  }
});

/**
 * @swagger
 * /api/cuentas:
 *   post:
 *     summary: Crear una nueva cuenta bancaria
 *     tags: [Cuentas Bancarias]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - nombre_cuenta
 *               - entidad_bancaria
 *               - estado
 *             properties:
 *               nombre_cuenta:
 *                 type: string
 *               entidad_bancaria:
 *                 type: string
 *               descripcion:
 *                 type: string
 *               estado:
 *                 type: boolean
 *     responses:
 *       201:
 *         description: Cuenta creada
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/CuentaBancaria'
 */
router.post('/', async (req, res, next) => {
  try {
    const { nombre_cuenta, entidad_bancaria, descripcion, estado } = req.body;
    if (!nombre_cuenta || !entidad_bancaria || typeof estado !== 'boolean') {
      return res.status(400).json({ error: 'Datos incompletos o inválidos' });
    }
    const result = await pool.query(
      'INSERT INTO cuentas_bancarias (id_cuenta, nombre_cuenta, entidad_bancaria, descripcion, estado) VALUES (NULL, $1, $2, $3, $4) RETURNING *',
      [nombre_cuenta, entidad_bancaria, descripcion, estado]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    next(err);
  }
});

/**
 * @swagger
 * /api/cuentas/{id}:
 *   get:
 *     summary: Obtener una cuenta bancaria por ID
 *     tags: [Cuentas Bancarias]
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: ID de la cuenta bancaria
 *     responses:
 *       200:
 *         description: Cuenta encontrada
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/CuentaBancaria'
 *       404:
 *         description: Cuenta no encontrada
 */
router.get('/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    const result = await pool.query('SELECT * FROM cuentas_bancarias WHERE id_cuenta = $1', [id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Cuenta no encontrada' });
    }
    res.json(result.rows[0]);
  } catch (err) {
    next(err);
  }
});

/**
 * @swagger
 * /api/cuentas/{id}:
 *   put:
 *     summary: Actualizar una cuenta bancaria
 *     tags: [Cuentas Bancarias]
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: ID de la cuenta bancaria
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               nombre_cuenta:
 *                 type: string
 *               entidad_bancaria:
 *                 type: string
 *               descripcion:
 *                 type: string
 *               estado:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: Cuenta actualizada
 *       404:
 *         description: Cuenta no encontrada
 */
router.put('/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    const { nombre_cuenta, entidad_bancaria, descripcion, estado } = req.body;
    const result = await pool.query(
      'UPDATE cuentas_bancarias SET nombre_cuenta=$1, entidad_bancaria=$2, descripcion=$3, estado=$4 WHERE id_cuenta=$5 RETURNING *',
      [nombre_cuenta, entidad_bancaria, descripcion, estado, id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Cuenta no encontrada' });
    }
    res.json(result.rows[0]);
  } catch (err) {
    next(err);
  }
});

/**
 * @swagger
 * /api/cuentas/{id}:
 *   delete:
 *     summary: Eliminar una cuenta bancaria
 *     tags: [Cuentas Bancarias]
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: ID de la cuenta bancaria
 *     responses:
 *       204:
 *         description: Cuenta eliminada
 *       404:
 *         description: Cuenta no encontrada
 */
router.delete('/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    const result = await pool.query('DELETE FROM cuentas_bancarias WHERE id_cuenta = $1 RETURNING *', [id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Cuenta no encontrada' });
    }
    res.status(204).send();
  } catch (err) {
    next(err);
  }
});

module.exports = router;