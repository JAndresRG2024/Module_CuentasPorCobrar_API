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
  try {
    const pago = await obtenerPagoPorId(id);
    const detalles = await obtenerDetallesPago(id);

    configurarCabecerasPDFIndividual(res, id);

    const doc = new PDFDocument({ margin: 40 });
    doc.pipe(res);

    renderizarEncabezadoPago(doc);
    renderizarDatosPago(doc, pago);
    renderizarDetallesPago(doc, detalles);
    renderizarPieDePagina(doc);

    doc.end();

    res.on('finish', () => auditarPagoIndividual(id, usuario));
  } catch (err) {
    console.error('Error generando PDF individual:', err);
    res.status(500).send('Error al generar el comprobante de pago');
  }
};

// ──────────────────────────────
// Funciones auxiliares
// ──────────────────────────────

const obtenerPagoPorId = async (id) => {
  const result = await pool.query('SELECT * FROM pagos WHERE id_pago = $1', [id]);
  if (result.rows.length === 0) throw new Error('Pago no encontrado');
  return result.rows[0];
};

const obtenerDetallesPago = async (id) => {
  const result = await pool.query('SELECT * FROM pagos_detalle WHERE id_pago = $1', [id]);
  return result.rows;
};

const configurarCabecerasPDFIndividual = (res, id) => {
  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `attachment; filename=pago_${id}.pdf`);
};

const renderizarEncabezadoPago = (doc) => {
  doc
    .fontSize(22)
    .fillColor('#2c3e50')
    .text('Comprobante de Pago', { align: 'center', underline: true })
    .moveDown(1.5);
};

const renderizarDatosPago = (doc, pago) => {
  const fecha = pago.fecha ? new Date(pago.fecha).toLocaleDateString() : 'N/D';

  doc
    .fontSize(12)
    .fillColor('black')
    .font('Helvetica').text('ID Pago: ', { continued: true }).font('Helvetica-Bold').text(pago.id_pago)
    .font('Helvetica').text('Número: ', { continued: true }).font('Helvetica-Bold').text(pago.numero_pago)
    .font('Helvetica').text('Descripción: ', { continued: true }).font('Helvetica-Bold').text(pago.descripcion || '—')
    .font('Helvetica').text('Fecha: ', { continued: true }).font('Helvetica-Bold').text(fecha)
    .font('Helvetica').text('Cuenta: ', { continued: true }).font('Helvetica-Bold').text(pago.id_cuenta || '—')
    .font('Helvetica').text('Cliente: ', { continued: true }).font('Helvetica-Bold').text(pago.id_cliente || '—');

  doc
    .moveDown(1)
    .moveTo(doc.page.margins.left, doc.y)
    .lineTo(doc.page.width - doc.page.margins.right, doc.y)
    .strokeColor('#cccccc')
    .lineWidth(1)
    .stroke()
    .moveDown(1);
};

const renderizarDetallesPago = (doc, detalles) => {
  doc
    .fontSize(14)
    .fillColor('#2c3e50')
    .text('Detalles del Pago', { underline: true })
    .moveDown(0.5);

  const startY = doc.y + 10;

  const columnas = {
    num: doc.page.margins.left,
    factura: doc.page.margins.left + 100,
    monto: doc.page.margins.left + 220,
  };

  doc
    .fontSize(11)
    .font('Helvetica-Bold')
    .fillColor('black')
    .text('N°', columnas.num, startY)
    .text('Factura', columnas.factura, startY)
    .text('Monto Pagado', columnas.monto, startY);

  doc
    .moveTo(columnas.num, startY + 15)
    .lineTo(columnas.monto + 100, startY + 15)
    .strokeColor('#cccccc')
    .lineWidth(1)
    .stroke();

  let y = startY + 20;

  if (detalles.length === 0) {
    doc
      .font('Helvetica-Oblique')
      .fontSize(11)
      .text('Sin detalles de pago.', columnas.num, y);
    return;
  }

  detalles.forEach((det, idx) => {
    doc
      .font('Helvetica')
      .fontSize(11)
      .fillColor('black')
      .text(idx + 1, columnas.num, y)
      .text(det.id_factura ?? '—', columnas.factura, y)
      .text(`$${Number(det.monto_pagado).toFixed(2)}`, columnas.monto, y, { width: 80 });

    y += 18;

    // Control de salto de página si se pasa del límite
    if (y > doc.page.height - 60) {
      doc.addPage();
      y = doc.y;
    }
  });
};

const auditarPagoIndividual = async (id, usuario) => {
  try {
    await pool.query('UPDATE pagos SET pdf_generado = true WHERE id_pago = $1', [id]);

    await enviarAuditoria({
      accion: 'DOWNLOAD_PDF',
      tabla: 'pagos',
      id_usuario: usuario.id || null,
      details: { id_pago: id, tipo: 'descarga PDF individual' },
      nombre_rol: usuario.rol || 'Sistema',
    });
  } catch (err) {
    console.error('Error actualizando pdf_generado o auditando:', err);
  }
};

const generarReportePagosPDF = async (res, usuario = {}) => {
  try {
    const pagos = await obtenerPagos();

    configurarCabecerasPDF(res);

    const doc = new PDFDocument({ margin: 40 });
    doc.pipe(res);

    renderizarEncabezado(doc);
    renderizarTablaPagos(doc, pagos);
    renderizarPieDePagina(doc);

    doc.end();

    res.on('finish', () => auditarDescarga(usuario));
  } catch (err) {
    console.error('Error generando el reporte de pagos PDF:', err);
    res.status(500).send('Error al generar el reporte');
  }
};

// Funciones auxiliares

const obtenerPagos = async () => {
  const result = await pool.query('SELECT * FROM pagos ORDER BY id_pago');
  return result.rows;
};

const configurarCabecerasPDF = (res) => {
  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', 'attachment; filename=reporte_pagos.pdf');
};

const renderizarEncabezado = (doc) => {
  doc
    .fontSize(22)
    .fillColor('#2c3e50')
    .text('Reporte General de Pagos', { align: 'center', underline: true })
    .moveDown(1.5);
};

const renderizarTablaPagos = (doc, pagos) => {
  const startY = doc.y + 10;

  const columnas = {
    id: doc.page.margins.left,
    numero: doc.page.margins.left + 60,
    descripcion: doc.page.margins.left + 140,
    fecha: doc.page.margins.left + 260,
    cuenta: doc.page.margins.left + 340,
    cliente: doc.page.margins.left + 420,
  };

  // Títulos de columnas
  doc
    .fontSize(11)
    .fillColor('black')
    .font('Helvetica-Bold')
    .text('ID', columnas.id, startY)
    .text('Número', columnas.numero, startY)
    .text('Descripción', columnas.descripcion, startY)
    .text('Fecha', columnas.fecha, startY)
    .text('Cuenta', columnas.cuenta, startY)
    .text('Cliente', columnas.cliente, startY);

  doc
    .moveTo(columnas.id, startY + 15)
    .lineTo(columnas.cliente + 80, startY + 15)
    .strokeColor('#cccccc')
    .lineWidth(1)
    .stroke();

  let y = startY + 20;

  pagos.forEach((pago) => {
    const fecha = pago.fecha
      ? new Date(pago.fecha).toLocaleDateString()
      : '';

    doc
      .font('Helvetica')
      .fontSize(10)
      .fillColor('black')
      .text(pago.id_pago ?? '', columnas.id, y)
      .text(pago.numero_pago ?? '', columnas.numero, y)
      .text(pago.descripcion ?? '', columnas.descripcion, y, { width: 100 })
      .text(fecha, columnas.fecha, y)
      .text(pago.id_cuenta ?? '', columnas.cuenta, y)
      .text(pago.id_cliente ?? '', columnas.cliente, y);

    y += 18;

    if (y > doc.page.height - 50) {
      doc.addPage();
      y = doc.y;
    }
  });
};

const renderizarPieDePagina = (doc) => {
  doc
    .moveDown(2)
    .fontSize(10)
    .fillColor('gray')
    .text(
      'Documento generado automáticamente por el sistema de Cuentas por Cobrar.',
      { align: 'center' }
    );
};

const auditarDescarga = async (usuario) => {
  try {
    await enviarAuditoria({
      accion: 'DOWNLOAD_PDF',
      tabla: 'pagos',
      id_usuario: usuario.id || null,
      details: { tipo: 'descarga reporte general de pagos' },
      nombre_rol: usuario.rol || 'Sistema',
    });
  } catch (err) {
    console.error('Error auditando descarga de reporte:', err);
  }
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