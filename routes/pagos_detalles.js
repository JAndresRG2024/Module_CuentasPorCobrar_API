const express = require('express');
const router = express.Router();
const pagosDetalleController = require('../controllers/pagosDetalleController');

/**
 * @swagger
 * tags:
 *   name: PagosDetalle
 *   description: EndPoints de Operaciones sobre Detalles de Pagos
 */

/**
 * @swagger
 * /api/pagos-detalle:
 *   get:
 *     summary: Obtener todos los detalles de pagos
 *     tags: [PagosDetalle]
 *     responses:
 *       200:
 *         description: Lista de detalles de pagos
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 */
router.get('/', pagosDetalleController.getAll);

/**
 * @swagger
 * /api/pagos-detalle/{id}:
 *   get:
 *     summary: Obtener un detalle de pago por ID
 *     tags: [PagosDetalle]
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: integer
 *         required: true
 *         description: ID del detalle de pago
 *     responses:
 *       200:
 *         description: Detalle de pago encontrado
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *       404:
 *         description: Detalle de pago no encontrado
 */
router.get('/:id', pagosDetalleController.getById);

/**
 * @swagger
 * /api/pagos-detalle:
 *   post:
 *     summary: Crear un nuevo detalle de pago
 *     tags: [PagosDetalle]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               id_pago:
 *                 type: integer
 *               id_factura:
 *                 type: integer
 *               monto_pagado:
 *                 type: string
 *     responses:
 *       201:
 *         description: Detalle de pago creado
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *       400:
 *         description: Error de validación
 */
router.post('/', pagosDetalleController.create);

/**
 * @swagger
 * /api/pagos-detalle/{id}:
 *   put:
 *     summary: Actualizar un detalle de pago
 *     tags: [PagosDetalle]
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: integer
 *         required: true
 *         description: ID del detalle de pago
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               id_pago:
 *                 type: integer
 *               id_factura:
 *                 type: integer
 *               monto_pagado:
 *                 type: string
 *     responses:
 *       200:
 *         description: Detalle de pago actualizado
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *       404:
 *         description: Detalle de pago no encontrado
 */
router.put('/:id', pagosDetalleController.update);

/**
 * @swagger
 * /api/pagos-detalle/{id}:
 *   delete:
 *     summary: Eliminar un detalle de pago
 *     tags: [PagosDetalle]
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: integer
 *         required: true
 *         description: ID del detalle de pago
 *     responses:
 *       200:
 *         description: Detalle de pago eliminado
 *       404:
 *         description: Detalle de pago no encontrado
 */
router.delete('/:id', pagosDetalleController.delete);

module.exports = router;