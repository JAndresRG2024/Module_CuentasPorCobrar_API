const express = require('express');
const router = express.Router();
const fetch = (...args) => import('node-fetch').then(({ default: fetch }) => fetch(...args));
const { enviarAuditoria } = require('../models/Auditoria');
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
    const pagosDetalleResult = await pool.query('SELECT * FROM pagos_detalle');
    const pagosPorFactura = {};
    pagosDetalleResult.rows.forEach(row => {
      if (!pagosPorFactura[row.id_factura]) pagosPorFactura[row.id_factura] = 0;
      pagosPorFactura[row.id_factura] += Number(row.monto_pagado);
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

    // 6. Obtener pagos realizados por cliente
    const pagosCabeceraResult = await pool.query('SELECT * FROM pagos');
    const pagosCabecera = pagosCabeceraResult.rows;

    // 7. Armar respuesta con datos de cliente, total_deuda, facturas pendientes y pagos realizados
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

        // Obtener pagos realizados por este cliente
        const pagosCliente = pagosCabecera
          .filter(p => p.id_cliente === c.id_cliente)
          .map(p => ({
            id_pago: p.id_pago,
            fecha: p.fecha,
            descripcion: p.descripcion,
            detalles: pagosDetalleResult.rows
              .filter(d => d.id_pago === p.id_pago)
              .map(d => ({
                id_detalle: d.id_detalle,
                id_factura: d.id_factura,
                monto_pagado: d.monto_pagado
              }))
          }));

        return {
          id_cliente: c.id_cliente,
          nombre: c.nombre,
          apellido: c.apellido,
          total_deuda: deudaPorCliente[c.id_cliente],
          facturas_pendientes: facturasPendientes, // [{id_factura, monto_pendiente}]
          pagos_realizados: pagosCliente // [{id_pago, fecha, descripcion, detalles: [{id_detalle, id_factura, monto_pagado}]}]
        };
      });
      await enviarAuditoria({
      accion: "SELECT",
      modulo: "cuentas por cobrar",
      tabla: "deudores",
      id_usuario: req.usuario?.id_usuario || null,
      details: { 
        tipo: "consulta general",
        consulta: 'SELECT * FROM clientes WHERE id_cliente IN (SELECT id_cliente FROM facturas WHERE tipo_pago = \'Credito\' AND estado_factura != \'Pagado\')',
        token: req.headers.authorization ? req.headers.authorization.split(' ')[1] : 'Sin token',
        usuario_autenticado: req.usuario?.usuario || 'Sin usuario autenticado'
      },
      nombre_rol: req.usuario?.nombre_rol || "Sistema",
    });

    res.json(deudores);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;