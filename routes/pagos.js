const express = require('express');
const router = express.Router();
const pool = require('../db');
const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');
const getStream = (...args) => import('get-stream').then(mod => mod.default(...args));
const { PassThrough } = require('stream');
const pagosController = require('../controllers/pagosController');

/**
 * @swagger
 * tags:
 *   name: Pagos
 *   description: EndPoints de Operaciones sobre Pagos
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
router.get('/', pagosController.getAll);

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
router.post('/', pagosController.create);

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
router.get('/:id', pagosController.getById);

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
router.put('/:id', pagosController.update);

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
    });G

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

router.post('/reporte/general', async (req, res) => {
  try {
    const pagosResult = await pool.query('SELECT * FROM pagos ORDER BY id_pago');
    const pagos = pagosResult.rows;

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=reporte_pagos.pdf`);

    const doc = new PDFDocument({ margin: 40 });
    doc.pipe(res);

    doc
      .fontSize(22)
      .fillColor('#2c3e50')
      .text('Reporte General de Pagos', { align: 'center', underline: true });
    doc.moveDown(1.5);

    // Encabezados de tabla
    const tableTop = doc.y + 10;
    const col1 = doc.page.margins.left;
    const col2 = col1 + 60;
    const col3 = col2 + 80;
    const col4 = col3 + 120;
    const col5 = col4 + 80;
    const col6 = col5 + 80;

    doc
      .fontSize(11)
      .fillColor('black')
      .font('Helvetica-Bold')
      .text('ID', col1, tableTop)
      .text('Número', col2, tableTop)
      .text('Descripción', col3, tableTop)
      .text('Fecha', col4, tableTop)
      .text('Cuenta', col5, tableTop)
      .text('Cliente', col6, tableTop);

    doc
      .moveTo(col1, tableTop + 15)
      .lineTo(col6 + 80, tableTop + 15)
      .strokeColor('#cccccc')
      .lineWidth(1)
      .stroke();

    let y = tableTop + 20;
    pagos.forEach((pago) => {
      // Manejo seguro de fecha y campos nulos
      let fecha = '';
      try {
        fecha = pago.fecha ? new Date(pago.fecha).toLocaleDateString() : '';
      } catch {
        fecha = '';
      }
      doc
        .font('Helvetica')
        .fontSize(10)
        .text(pago.id_pago !== null && pago.id_pago !== undefined ? pago.id_pago : '', col1, y)
        .text(pago.numero_pago !== null && pago.numero_pago !== undefined ? pago.numero_pago : '', col2, y)
        .text(pago.descripcion !== null && pago.descripcion !== undefined ? pago.descripcion : '', col3, y, { width: 110 })
        .text(fecha, col4, y)
        .text(pago.id_cuenta !== null && pago.id_cuenta !== undefined ? pago.id_cuenta : '', col5, y)
        .text(pago.id_cliente !== null && pago.id_cliente !== undefined ? pago.id_cliente : '', col6, y);
      y += 18;
      if (y > doc.page.height - 50) {
        doc.addPage();
        y = doc.y;
      }
    });

    doc.moveDown(2);

    doc
      .fontSize(10)
      .fillColor('gray')
      .text('Documento generado automáticamente por el sistema de Cuentas por Cobrar.', {
        align: 'center',
        baseline: 'bottom'
      });

    doc.end();
  } catch (err) {
    console.error('ERROR GENERANDO REPORTE PDF en rutas:', err);
    if (!res.headersSent) {
      res.status(500).json({ error: 'Error al generar el reporte PDF en rutas pt2' });
    }
  }
});
module.exports = router;