const express = require('express');
const router = express.Router();

/**
 * @swagger
 * /api/saludo:
 *   get:
 *     summary: Retorna un saludo
 *     tags: [Saludo]
 *     responses:
 *       200:
 *         description: Respuesta exitosa
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 mensaje:
 *                   type: string
 *                   example: Hola mundo
 */
router.get('/saludo', (req, res) => {
  res.json({ mensaje: 'Hola mundo' });
});

module.exports = router;
