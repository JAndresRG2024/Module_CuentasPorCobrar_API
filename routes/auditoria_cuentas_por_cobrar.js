const express = require('express');
const router = express.Router();
/**
 * @swagger
 * /:
 *   post:
 *     summary: Realiza una auditoría de cuentas por cobrar
 *     description: Endpoint para auditar cuentas por cobrar.
 *     tags:
 *       - Auditoría Cuentas por Cobrar
 *     requestBody:
 *       required: false
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *     responses:
 *       200:
 *         description: Auditoría realizada correctamente
 *         content:
 *           text/plain:
 *             schema:
 *               type: string
 *               example: Auditoría de cuentas por cobrar
 */
router.post('/', (req, res) => {
    res.send('Auditoría de cuentas por cobrar');
});
module.exports = router;