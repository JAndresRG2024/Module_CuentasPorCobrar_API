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


/**
 * @swagger
 * /api/clientes/deudores:
 *   get:
 *     summary: Obtiene la lista de clientes que deben dinero (tienen facturas a crédito pendientes)
 *     responses:
 *       200:
 *         description: Lista de clientes deudores
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   id_cliente:
 *                     type: integer
 *                   nombre:
 *                     type: string
 *                   apellido:
 *                     type: string
 *                   total_deuda:
 *                     type: number
 */
router.get('/deudores', async (req, res) => {
  try {
    // 1. Obtener todos los clientes
    const clientesRes = await fetch('https://apdis-p5v5.vercel.app/api/clientes');
    if (!clientesRes.ok) throw new Error('Error al obtener clientes externos');
    const clientes = await clientesRes.json();

    // 2. Obtener todas las facturas a crédito (no pagadas)
    const facturasRes = await fetch('https://apdis-p5v5.vercel.app/api/facturas');
    if (!facturasRes.ok) throw new Error('Error al obtener facturas externas');
    const facturas = await facturasRes.json();

    // 3. Filtrar solo facturas a crédito y no pagadas
    const facturasCreditoPendientes = facturas.filter(f =>
  f.tipo_pago === 'Credito' && f.estado_factura !== 'Pagado'
  );

    // 4. Obtener pagos realizados (desde la base de datos local)
    const pool = require('../db');
    const pagosDetalleResult = await pool.query('SELECT id_factura, SUM(monto_pagado) as pagado FROM pagos_detalle GROUP BY id_factura');
    const pagosPorFactura = {};
    pagosDetalleResult.rows.forEach(row => {
      pagosPorFactura[row.id_factura] = Number(row.pagado);
    });

    // 5. Calcular deuda por cliente
    const deudaPorCliente = {};
   facturasCreditoPendientes.forEach(fact => {
  const pagado = pagosPorFactura[fact.id_factura] || 0;
  const pendiente = Number(fact.monto_total) - pagado;
  if (pendiente > 0) {
    if (!deudaPorCliente[fact.id_cliente]) deudaPorCliente[fact.id_cliente] = 0;
    deudaPorCliente[fact.id_cliente] += pendiente;
  }
});

    // 6. Armar respuesta con datos de cliente y total_deuda
    const deudores = clientes
  .filter(c => deudaPorCliente[c.id_cliente])
  .map(c => {
    // Obtener facturas pendientes de este cliente con monto pendiente
    const facturasPendientes = facturasCreditoPendientes
      .filter(f => f.id_cliente === c.id_cliente)
      .map(f => {
        const pagado = pagosPorFactura[f.id_factura] || 0;
        const pendiente = Number(f.monto_total) - pagado;
        return pendiente > 0
          ? {
              id_factura: f.id_factura,
              monto_pendiente: pendiente
            }
          : null;
      })
      .filter(f => f !== null);

    return {
      id_cliente: c.id_cliente,
      nombre: c.nombre,
      apellido: c.apellido,
      total_deuda: deudaPorCliente[c.id_cliente],
      facturas_pendientes: facturasPendientes // [{id_factura, monto_pendiente}]
    };
  });
res.json(deudores);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;