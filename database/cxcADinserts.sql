-- Insertar cuentas bancarias (deja id_cuenta en NULL para que el trigger lo genere)
INSERT INTO cuentas_bancarias (id_cuenta, nombre_cuenta, entidad_bancaria, descripcion)
VALUES
(NULL, 'Cuenta Corriente Principal', 'Banco Pichincha', 'Cuenta principal de la empresa'),
(NULL, 'Cuenta de Ahorros Secundaria', 'Banco Guayaquil', 'Cuenta secundaria para ahorros');

-- Insertar pagos_cabecera (deja numero_pago en NULL para que el trigger lo genere)
INSERT INTO pagos_cabecera (numero_pago, descripcion, fecha, id_cuenta, id_cliente, pdf_generado)
VALUES
(NULL, 'Pago de factura 1001', '2025-05-01', (SELECT id_cuenta FROM cuentas_bancarias LIMIT 1), 1, FALSE),
(NULL, 'Pago de factura 1002', '2025-05-02', (SELECT id_cuenta FROM cuentas_bancarias OFFSET 1 LIMIT 1), 2, TRUE);

-- Insertar pagos_detalle
INSERT INTO pagos_detalle (id_pago, id_factura, monto_pagado, saldo_anterior, saldo_nuevo)
VALUES
(1, 1001, 500.00, 1000.00, 500.00),
(2, 1002, 300.00, 800.00, 500.00);

-- Insertar documentos_pdf
INSERT INTO documentos_pdf (id_pago, url_pdf)
VALUES
(1, 'https://ejemplo.com/pdfs/pago1.pdf'),
(2, 'https://ejemplo.com/pdfs/pago2.pdf');

-- Insertar auditoria
INSERT INTO auditoria (id_usuario, accion, tabla_afectada, datos_anteriores, datos_nuevos, ip_usuario)
VALUES
(10, 'INSERT', 'cuentas_bancarias', NULL, '{"id_cuenta":"CTA-BAN-001"}', '192.168.1.10'),
(11, 'INSERT', 'pagos_cabecera', NULL, '{"numero_pago":"PAG-CLI-00001"}', '192.168.1.11');

-- ...existing code...