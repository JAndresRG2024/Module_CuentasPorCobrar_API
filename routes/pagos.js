const express = require('express');
const router = express.Router();
const pool = require('../db');
const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');
const getStream = require('get-stream');
const { PassThrough } = require('stream');
/**
 * @swagger
 * tags:
 *   name: Pagos
 *   description: EndPoints de Operaciones sobre Pagos
 */

/**
 * @swagger
 * components:
 *   schemas:
 *     Pago:
 *       type: object
 *       properties:
 *         id_pago:
 *           type: integer
 *         numero_pago:
 *           type: string
 *         descripcion:
 *           type: string
 *         fecha:
 *           type: string
 *           format: date
 *         id_cuenta:
 *           type: string
 *         id_cliente:
 *           type: integer
 *         pdf_generado:
 *           type: boolean
 */

/**
 * @swagger
 * /api/pagos:
 *   get:
 *     summary: Obtener todos los pagos
 *     tags: [Pagos]
 *     responses:
 *       200:
 *         description: Lista de pagos
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Pago'
 */
router.get('/', async (req, res) => {
    try {
        const pagosResult = await pool.query('SELECT * FROM pagos ORDER BY id_pago DESC');
        const pagos = pagosResult.rows;

        // Obtener detalles para todos los pagos
        const detallesResult = await pool.query('SELECT * FROM pagos_detalle WHERE id_pago = ANY($1)', [pagos.map(p => p.id_pago)]);
        const detallesPorPago = {};
        detallesResult.rows.forEach(det => {
            if (!detallesPorPago[det.id_pago]) detallesPorPago[det.id_pago] = [];
            detallesPorPago[det.id_pago].push(det);
        });

        // Agregar detalles a cada pago
        const pagosConDetalles = pagos.map(pago => ({
            ...pago,
            detalles: detallesPorPago[pago.id_pago] || []
        }));

        res.json(pagosConDetalles);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

/**
 * @swagger
 * /api/pagos:
 *   post:
 *     summary: Crear un nuevo pago
 *     tags: [Pagos]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Pago'
 *     responses:
 *       201:
 *         description: Pago creado
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Pago'
 *       400:
 *         description: Error de validación
 */
router.post('/', async (req, res) => {
    const { numero_pago, descripcion, fecha, id_cuenta, id_cliente, pdf_generado } = req.body;
    try {
        const result = await pool.query(
            `INSERT INTO pagos (numero_pago, descripcion, fecha, id_cuenta, id_cliente, pdf_generado)
             VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
            [numero_pago, descripcion, fecha, id_cuenta, id_cliente, pdf_generado || false]
        );
        res.status(201).json(result.rows[0]);
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
});

/**
 * @swagger
 * /api/pagos/{id}:
 *   get:
 *     summary: Obtener un pago por ID
 *     tags: [Pagos]
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: integer
 *         required: true
 *         description: ID del pago
 *     responses:
 *       200:
 *         description: Pago encontrado
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Pago'
 *       404:
 *         description: Pago no encontrado
 */
router.get('/:id', async (req, res) => {
    try {
        const pagoResult = await pool.query('SELECT * FROM pagos WHERE id_pago = $1', [req.params.id]);
        if (pagoResult.rows.length === 0) return res.status(404).json({ error: 'Pago no encontrado' });

        const pago = pagoResult.rows[0];
        const detallesResult = await pool.query('SELECT * FROM pagos_detalle WHERE id_pago = $1', [pago.id_pago]);
        pago.detalles = detallesResult.rows;

        res.json(pago);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

/**
 * @swagger
 * /api/pagos/{id}:
 *   put:
 *     summary: Actualizar un pago
 *     tags: [Pagos]
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: integer
 *         required: true
 *         description: ID del pago
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Pago'
 *     responses:
 *       200:
 *         description: Pago actualizado
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Pago'
 *       404:
 *         description: Pago no encontrado
 */
router.put('/:id', async (req, res) => {
    const { numero_pago, descripcion, fecha, id_cuenta, id_cliente, pdf_generado } = req.body;
    try {
        const result = await pool.query(
            `UPDATE pagos SET
                numero_pago = $1,
                descripcion = $2,
                fecha = $3,
                id_cuenta = $4,
                id_cliente = $5,
                pdf_generado = $6
             WHERE id_pago = $7 RETURNING *`,
            [numero_pago, descripcion, fecha, id_cuenta, id_cliente, pdf_generado, req.params.id]
        );
        if (result.rows.length === 0) return res.status(404).json({ error: 'Pago no encontrado' });
        res.json(result.rows[0]);
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
});

/**
 * @swagger
 * /api/pagos/{id}:
 *   delete:
 *     summary: Eliminar un pago
 *     tags: [Pagos]
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: integer
 *         required: true
 *         description: ID del pago
 *     responses:
 *       200:
 *         description: Pago eliminado
 *       404:
 *         description: Pago no encontrado
 */
router.delete('/:id', async (req, res) => {
    try {
        const result = await pool.query('DELETE FROM pagos WHERE id_pago = $1 RETURNING *', [req.params.id]);
        if (result.rows.length === 0) return res.status(404).json({ error: 'Pago no encontrado' });
        res.json({ message: 'Pago eliminado' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

/**
 * @swagger
 * /api/pagos/{id}/detalles/{id_detalle}:
 *   get:
 *     summary: Obtener un detalle de pago específico de un pago
 *     tags: [Pagos]
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: integer
 *         required: true
 *         description: ID del pago
 *       - in: path
 *         name: id_detalle
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
router.get('/:id/detalles/:id_detalle', async (req, res) => {
    try {
        const { id, id_detalle } = req.params;
        const result = await pool.query(
            'SELECT * FROM pagos_detalle WHERE id_pago = $1 AND id_detalle = $2',
            [id, id_detalle]
        );
        if (result.rows.length === 0) return res.status(404).json({ error: 'Detalle de pago no encontrado' });
        res.json(result.rows[0]);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

/**
 * @swagger
 * /api/pagos/{id}/detalles:
 *   post:
 *     summary: Crear un nuevo detalle para un pago
 *     tags: [Pagos]
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: integer
 *         required: true
 *         description: ID del pago
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
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
router.post('/:id/detalles', async (req, res) => {
    const { id } = req.params;
    const { id_factura, monto_pagado} = req.body;
    try {
        const result = await pool.query(
            `INSERT INTO pagos_detalle (id_pago, id_factura, monto_pagado)
             VALUES ($1, $2, $3) RETURNING *`,
            [id, id_factura, monto_pagado]
        );
        res.status(201).json(result.rows[0]);
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
});

/**
 * @swagger
 * /api/pagos/{id}/detalles/{id_detalle}:
 *   put:
 *     summary: Actualizar un detalle de pago de un pago
 *     tags: [Pagos]
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: integer
 *         required: true
 *         description: ID del pago
 *       - in: path
 *         name: id_detalle
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
router.put('/:id/detalles/:id_detalle', async (req, res) => {
    const { id, id_detalle } = req.params;
    const { id_factura, monto_pagado } = req.body;
    try {
        const result = await pool.query(
            `UPDATE pagos_detalle SET
                id_factura = $1,
                monto_pagado = $2
             WHERE id_pago = $3 AND id_detalle = $4 RETURNING *`,
            [id_factura, monto_pagado, id, id_detalle]
        );
        if (result.rows.length === 0) return res.status(404).json({ error: 'Detalle de pago no encontrado' });
        res.json(result.rows[0]);
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
});

/**
 * @swagger
 * /api/pagos/{id}/detalles/{id_detalle}:
 *   delete:
 *     summary: Eliminar un detalle de pago de un pago
 *     tags: [Pagos]
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: integer
 *         required: true
 *         description: ID del pago
 *       - in: path
 *         name: id_detalle
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
router.delete('/:id/detalles/:id_detalle', async (req, res) => {
    const { id, id_detalle } = req.params;
    try {
        const result = await pool.query(
            'DELETE FROM pagos_detalle WHERE id_pago = $1 AND id_detalle = $2 RETURNING *',
            [id, id_detalle]
        );
        if (result.rows.length === 0) return res.status(404).json({ error: 'Detalle de pago no encontrado' });
        res.json({ message: 'Detalle de pago eliminado' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

/**
 * @swagger
 * /api/pagos/{id}/generar-pdf:
 *   post:
 *     summary: Generar PDF de un pago y marcarlo como generado
 *     tags: [Pagos]
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: integer
 *         required: true
 *         description: ID del pago
 *     responses:
 *       200:
 *         description: PDF generado y pago actualizado
 *       404:
 *         description: Pago no encontrado
 */
router.post('/:id/generar-pdf', async (req, res) => {
  const { id } = req.params;
  try {
    const pagoResult = await pool.query('SELECT * FROM pagos WHERE id_pago = $1', [id]);
    if (pagoResult.rows.length === 0) return res.status(404).json({ error: 'Pago no encontrado' });

    const pago = pagoResult.rows[0];
    const detallesResult = await pool.query('SELECT * FROM pagos_detalle WHERE id_pago = $1', [id]);
    const detalles = detallesResult.rows;

    // Establecer headers ANTES de pipe
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=pago_${id}.pdf`);

    // Pipe PDFKit directamente a la respuesta
    const doc = new PDFDocument({ margin: 40 });
    doc.pipe(res);

    // Encabezado
    doc
    .fontSize(22)
    .fillColor('#2c3e50')
    .text('Comprobante de Pago', { align: 'center', underline: true });
    doc.moveDown(1.5);

    // Datos principales del pago
    doc
    .fontSize(12)
    .fillColor('black')
    .text(`ID Pago: `, { continued: true })
    .font('Helvetica-Bold').text(`${pago.id_pago}`)
    .font('Helvetica').text(`Número: `, { continued: true })
    .font('Helvetica-Bold').text(`${pago.numero_pago}`)
    .font('Helvetica').text(`Descripción: `, { continued: true })
    .font('Helvetica-Bold').text(`${pago.descripcion}`)
    .font('Helvetica').text(`Fecha: `, { continued: true })
    .font('Helvetica-Bold').text(`${new Date(pago.fecha).toLocaleDateString()}`)
    .font('Helvetica').text(`Cuenta: `, { continued: true })
    .font('Helvetica-Bold').text(`${pago.id_cuenta}`)
    .font('Helvetica').text(`Cliente: `, { continued: true })
    .font('Helvetica-Bold').text(`${pago.id_cliente}`);
    doc.moveDown(1);

    // Línea divisoria
    doc
    .moveTo(doc.page.margins.left, doc.y)
    .lineTo(doc.page.width - doc.page.margins.right, doc.y)
    .strokeColor('#cccccc')
    .lineWidth(1)
    .stroke();
    doc.moveDown(1);

    // Título de detalles
    doc
    .fontSize(14)
    .fillColor('#2c3e50')
    .text('Detalles del Pago', { underline: true });
    doc.moveDown(0.5);

    // Tabla de detalles
    const tableTop = doc.y + 10;
    const col1 = doc.page.margins.left;
    const col2 = col1 + 100;
    const col3 = col2 + 120;

    doc
    .fontSize(11)
    .fillColor('black')
    .text('N°', col1, tableTop, { bold: true })
    .text('Factura', col2, tableTop)
    .text('Monto Pagado', col3, tableTop);

    doc
    .moveTo(col1, tableTop + 15)
    .lineTo(col3 + 100, tableTop + 15)
    .strokeColor('#cccccc')
    .lineWidth(1)
    .stroke();

    let y = tableTop + 20;
    detalles.forEach((det, idx) => {
    doc
        .font('Helvetica')
        .fontSize(11)
        .text(idx + 1, col1, y)
        .text(det.id_factura, col2, y)
        .text(`$${Number(det.monto_pagado).toFixed(2)}`, col3, y, { width: 100 });
    y += 18;
    });

    if (detalles.length === 0) {
    doc.font('Helvetica-Oblique').fontSize(11).text('Sin detalles de pago.', col1, y);
    }

    doc.moveDown(2);

    // Pie de página
    doc
    .fontSize(10)
    .fillColor('gray')
    .text('Documento generado automáticamente por el sistema de Cuentas por Cobrar.', {
        align: 'center',
        baseline: 'bottom'
    });

    doc.end();

    // Cuando termine de enviar el PDF, actualiza pdf_generado
    res.on('finish', async () => {
      try {
        await pool.query('UPDATE pagos SET pdf_generado = true WHERE id_pago = $1', [id]);
      } catch (err) {
        console.error('Error actualizando pdf_generado:', err);
      }
    });

  } catch (err) {
    console.error('ERROR GENERANDO PDF:', err);
    // Si los headers ya fueron enviados, no puedes enviar JSON, solo cerrar la respuesta
    if (!res.headersSent) {
      res.status(500).json({ error: 'Error al generar el PDF' });
    }
  }
});

module.exports = router;