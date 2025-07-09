const pool = require('../db');
const PDFDocument = require('pdfkit');
const { enviarAuditoria } = require('./Auditoria');

const getAllPagos = async () => {
  const pagosResult = await pool.query('SELECT * FROM pagos ORDER BY id_pago DESC');
  const pagos = pagosResult.rows;

  const detallesResult = await pool.query(
    'SELECT * FROM pagos_detalle WHERE id_pago = ANY($1)',
    [pagos.map(p => p.id_pago)]
  );
  const detallesPorPago = {};
  detallesResult.rows.forEach(det => {
    if (!detallesPorPago[det.id_pago]) detallesPorPago[det.id_pago] = [];
    detallesPorPago[det.id_pago].push(det);
  });

  return pagos.map(pago => ({
    ...pago,
    detalles: detallesPorPago[pago.id_pago] || []
  }));
};

const getPagoById = async (id) => {
  const pagoResult = await pool.query('SELECT * FROM pagos WHERE id_pago = $1', [id]);
  if (pagoResult.rows.length === 0) return null;
  const pago = pagoResult.rows[0];
  const detallesResult = await pool.query('SELECT * FROM pagos_detalle WHERE id_pago = $1', [id]);
  pago.detalles = detallesResult.rows;
  return pago;
};

const createPago = async (data) => {
  const { numero_pago, descripcion, fecha, id_cuenta, id_cliente, pdf_generado } = data;
  const result = await pool.query(
    `INSERT INTO pagos (numero_pago, descripcion, fecha, id_cuenta, id_cliente, pdf_generado)
     VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
    [numero_pago, descripcion, fecha, id_cuenta, id_cliente, pdf_generado || false]
  );
  return result.rows[0];
};

const updatePago = async (id, data) => {
  const { numero_pago, descripcion, fecha, id_cuenta, id_cliente, pdf_generado } = data;
  const result = await pool.query(
    `UPDATE pagos SET
      numero_pago = $1,
      descripcion = $2,
      fecha = $3,
      id_cuenta = $4,
      id_cliente = $5,
      pdf_generado = $6
     WHERE id_pago = $7 RETURNING *`,
    [numero_pago, descripcion, fecha, id_cuenta, id_cliente, pdf_generado, id]
  );
  return result.rows[0];
};

const deletePago = async (id) => {
  const result = await pool.query('DELETE FROM pagos WHERE id_pago = $1 RETURNING *', [id]);
  return result.rows[0];
};

const generarPDFPago = async (id, res, usuario = {}) => {
  const pagoResult = await pool.query('SELECT * FROM pagos WHERE id_pago = $1', [id]);
  if (pagoResult.rows.length === 0) throw new Error('Pago no encontrado');
  const pago = pagoResult.rows[0];
  const detallesResult = await pool.query('SELECT * FROM pagos_detalle WHERE id_pago = $1', [id]);
  const detalles = detallesResult.rows;

  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `attachment; filename=pago_${id}.pdf`);

  const doc = new PDFDocument({ margin: 40 });
  doc.pipe(res);

  doc.fontSize(22).fillColor('#2c3e50').text('Comprobante de Pago', { align: 'center', underline: true });
  doc.moveDown(1.5);
  doc.fontSize(12).fillColor('black')
    .text(`ID Pago: `, { continued: true }).font('Helvetica-Bold').text(`${pago.id_pago}`)
    .font('Helvetica').text(`Número: `, { continued: true }).font('Helvetica-Bold').text(`${pago.numero_pago}`)
    .font('Helvetica').text(`Descripción: `, { continued: true }).font('Helvetica-Bold').text(`${pago.descripcion}`)
    .font('Helvetica').text(`Fecha: `, { continued: true }).font('Helvetica-Bold').text(`${new Date(pago.fecha).toLocaleDateString()}`)
    .font('Helvetica').text(`Cuenta: `, { continued: true }).font('Helvetica-Bold').text(`${pago.id_cuenta}`)
    .font('Helvetica').text(`Cliente: `, { continued: true }).font('Helvetica-Bold').text(`${pago.id_cliente}`);
  doc.moveDown(1);

  doc.moveTo(doc.page.margins.left, doc.y)
    .lineTo(doc.page.width - doc.page.margins.right, doc.y)
    .strokeColor('#cccccc').lineWidth(1).stroke();
  doc.moveDown(1);

  doc.fontSize(14).fillColor('#2c3e50').text('Detalles del Pago', { underline: true });
  doc.moveDown(0.5);

  const tableTop = doc.y + 10;
  const col1 = doc.page.margins.left;
  const col2 = col1 + 100;
  const col3 = col2 + 120;

  doc.fontSize(11).fillColor('black')
    .text('N°', col1, tableTop, { bold: true })
    .text('Factura', col2, tableTop)
    .text('Monto Pagado', col3, tableTop);

  doc.moveTo(col1, tableTop + 15)
    .lineTo(col3 + 100, tableTop + 15)
    .strokeColor('#cccccc').lineWidth(1).stroke();

  let y = tableTop + 20;
  detalles.forEach((det, idx) => {
    doc.font('Helvetica').fontSize(11)
      .text(idx + 1, col1, y)
      .text(det.id_factura, col2, y)
      .text(`$${Number(det.monto_pagado).toFixed(2)}`, col3, y, { width: 100 });
    y += 18;
  });

  if (detalles.length === 0) {
    doc.font('Helvetica-Oblique').fontSize(11).text('Sin detalles de pago.', col1, y);
  }

  doc.moveDown(2);
  doc.fontSize(10).fillColor('gray')
    .text('Documento generado automáticamente por el sistema de Cuentas por Cobrar.', {
      align: 'center',
      baseline: 'bottom'
    });

  doc.end();

  res.on('finish', async () => {
    try {
      await pool.query('UPDATE pagos SET pdf_generado = true WHERE id_pago = $1', [id]);
      await enviarAuditoria({
        accion: "DOWNLOAD_PDF",
        tabla: "pagos",
        id_usuario: usuario.id || null,
        details: { id_pago: id, tipo: "descarga PDF individual" },
        nombre_rol: usuario.rol || "Sistema",
      });
    } catch (err) {
      console.error('Error actualizando pdf_generado o auditando:', err);
    }
  });
};

const generarReportePagosPDF = async (res, usuario = {}) => {
  const pagosResult = await pool.query('SELECT * FROM pagos ORDER BY id_pago');
  const pagos = pagosResult.rows;

  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `attachment; filename=reporte_pagos.pdf`);

  const doc = new PDFDocument({ margin: 40 });
  doc.pipe(res);

  doc.fontSize(22).fillColor('#2c3e50').text('Reporte General de Pagos', { align: 'center', underline: true });
  doc.moveDown(1.5);

  const tableTop = doc.y + 10;
  const col1 = doc.page.margins.left;
  const col2 = col1 + 60;
  const col3 = col2 + 80;
  const col4 = col3 + 120;
  const col5 = col4 + 80;
  const col6 = col5 + 80;

  doc.fontSize(11).fillColor('black').font('Helvetica-Bold')
    .text('ID', col1, tableTop)
    .text('Número', col2, tableTop)
    .text('Descripción', col3, tableTop)
    .text('Fecha', col4, tableTop)
    .text('Cuenta', col5, tableTop)
    .text('Cliente', col6, tableTop);

  doc.moveTo(col1, tableTop + 15)
    .lineTo(col6 + 80, tableTop + 15)
    .strokeColor('#cccccc').lineWidth(1).stroke();

  let y = tableTop + 20;
  pagos.forEach((pago) => {
    let fecha = '';
    try {
      fecha = pago.fecha ? new Date(pago.fecha).toLocaleDateString() : '';
    } catch {
      fecha = '';
    }
    doc.font('Helvetica').fontSize(10)
      .text(pago.id_pago ?? '', col1, y)
      .text(pago.numero_pago ?? '', col2, y)
      .text(pago.descripcion ?? '', col3, y, { width: 110 })
      .text(fecha, col4, y)
      .text(pago.id_cuenta ?? '', col5, y)
      .text(pago.id_cliente ?? '', col6, y);
    y += 18;
    if (y > doc.page.height - 50) {
      doc.addPage();
      y = doc.y;
    }
  });

  doc.moveDown(2);
  doc.fontSize(10).fillColor('gray')
    .text('Documento generado automáticamente por el sistema de Cuentas por Cobrar.', {
      align: 'center',
      baseline: 'bottom'
    });

  doc.end();

  res.on('finish', async () => {
    try {
      await enviarAuditoria({
        accion: "DOWNLOAD_PDF",
        tabla: "pagos",
        id_usuario: usuario.id || null,
        details: { tipo: "descarga reporte general de pagos" },
        nombre_rol: usuario.rol || "Sistema",
      });
    } catch (err) {
      console.error('Error auditando descarga de reporte:', err);
    }
  });
};

module.exports = {
  getAllPagos,
  getPagoById,
  createPago,
  updatePago,
  deletePago,
  generarPDFPago,
  generarReportePagosPDF,
};