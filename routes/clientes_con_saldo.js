const express = require('express');
const router = express.Router();

/**
 * @swagger
 * /api/clientes/saldo:
 *   get:
 *     summary: Retorna el saldo de los clientes
 *     tags: [Clientes]
 *     responses:
 *       200:
 *         description: Respuesta exitosa
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 saldo:
 *                   type: number
 *                   example: 1500.50
 */
router.get('/saldo', (req, res) => {
  res.json({ saldo: 1500.50 });
});

module.exports = router;