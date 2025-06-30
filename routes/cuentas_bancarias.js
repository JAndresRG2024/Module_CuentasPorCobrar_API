const express = require('express');
const router = express.Router();
const cuentasController = require('../controllers/cuentasBancariasController');

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
router.get('/', cuentasController.getAll);

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
router.post('/', cuentasController.create);

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
router.get('/:id', cuentasController.getById);

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
router.put('/:id', cuentasController.update);

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
router.delete('/:id', cuentasController.delete);

module.exports = router;