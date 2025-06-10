-- Eliminar triggers
DROP TRIGGER IF EXISTS trigger_id_cuenta ON cuentas_bancarias;
DROP TRIGGER IF EXISTS trigger_numero_pago ON pagos_cabecera;

-- Eliminar funciones
DROP FUNCTION IF EXISTS generar_id_cuenta();
DROP FUNCTION IF EXISTS generar_numero_pago();

-- Eliminar tablas (en orden para respetar claves foráneas)
DROP TABLE IF EXISTS auditoria CASCADE;
DROP TABLE IF EXISTS documentos_pdf CASCADE;
DROP TABLE IF EXISTS pagos_detalle CASCADE;
DROP TABLE IF EXISTS pagos_cabecera CASCADE;
DROP TABLE IF EXISTS cuentas_bancarias CASCADE;

-- ...existing code...