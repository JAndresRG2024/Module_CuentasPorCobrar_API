const express = require('express');
const router = express.Router();
const facturasController = require('../controllers/facturasController');

/**
 * @swagger
 * /api/facturas/cliente/{id_cliente}:
 *   get:
 *     summary: Obtener facturas NO pagadas de un cliente
 *     tags: [Facturas]
 *     parameters:
 *       - in: path
 *         name: id_cliente
 *         schema:
 *           type: integer
 *         required: true
 *         description: ID del cliente
 *     responses:
 *       200:
 *         description: Lista de facturas no pagadas
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   nombre_cliente:
 *                     type: string
 *                   monto_total:
 *                     type: string
 *                   iva:
 *                     type: string
 */
router.get('/cliente/:id_cliente', facturasController.getFacturasNoPagadasPorCliente);

module.exports = router;