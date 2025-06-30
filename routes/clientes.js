const express = require('express');
const router = express.Router();
const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));

/**
 * @swagger
 * /api/clientes:
 *   get:
 *     summary: Obtiene la lista de clientes externos
 *     responses:
 *       200:
 *         description: Lista de clientes
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   id_cliente:
 *                     type: integer
 *                   nombre_cliente:
 *                     type: string
 */
router.get('/', async (req, res) => {
  try {
    const response = await fetch('https://apdis-p5v5.vercel.app/api/clientes');
    if (!response.ok) throw new Error('Error al obtener clientes externos');
    const data = await response.json();

    // Solo devolver id_cliente y nombre_cliente
    const clientes = data.map(c => ({
      id_cliente: c.id_cliente,
      nombre: c.nombre,
      apellido: c.apellido
    }));

    res.json(clientes);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;