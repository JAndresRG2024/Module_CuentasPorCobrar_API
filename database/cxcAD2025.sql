CREATE TABLE cuentas_bancarias (
    id_cuenta VARCHAR(15) PRIMARY KEY,  -- Ej: CTA-BAN-001
    nombre_cuenta VARCHAR(100) NOT NULL,
    entidad_bancaria VARCHAR(100) NOT NULL,
    descripcion TEXT,
    estado BOOLEAN NOT NULL DEFAULT TRUE  -- TRUE=Activo, FALSE=Inactivo
);
CREATE TABLE pagos_cabecera (
    id_pago SERIAL PRIMARY KEY,
    numero_pago VARCHAR(20) UNIQUE,  -- PAG-CLI-00001
    descripcion TEXT,
    fecha DATE NOT NULL,
    id_cuenta VARCHAR(15) NOT NULL REFERENCES cuentas_bancarias(id_cuenta),
    id_cliente INT NOT NULL,  -- Referencia externa (de facturación)
    pdf_generado BOOLEAN DEFAULT FALSE
);

CREATE TABLE pagos_detalle (
    id_detalle SERIAL PRIMARY KEY,
    id_pago INT NOT NULL REFERENCES pagos_cabecera(id_pago),
    id_factura INT NOT NULL,  -- Referencia externa (de facturación)
    monto_pagado NUMERIC(10, 2) NOT NULL,
    saldo_anterior NUMERIC(10, 2),  -- opcional para reportes
    saldo_nuevo NUMERIC(10, 2)
);

CREATE TABLE documentos_pdf (
    id_pago INT PRIMARY KEY REFERENCES pagos_cabecera(id_pago),
    url_pdf TEXT,
    fecha_generacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE auditoria (
    id_evento SERIAL PRIMARY KEY,
    id_usuario INT,  -- Viene del módulo de seguridad
    accion VARCHAR(50),
    modulo VARCHAR(50) DEFAULT 'CXC',
    tabla_afectada VARCHAR(50),
    datos_anteriores JSONB,
    datos_nuevos JSONB,
    fecha TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    ip_usuario VARCHAR(45)
);

-- Función y trigger para id_cuenta en cuentas_bancarias
CREATE OR REPLACE FUNCTION generar_id_cuenta()
RETURNS TRIGGER AS $$
DECLARE
    nuevo_id VARCHAR(15);
    ultimo_num INT;
BEGIN
    IF NEW.id_cuenta IS NULL THEN
        SELECT COALESCE(MAX(CAST(SUBSTRING(id_cuenta, 9, 3) AS INT)), 0) INTO ultimo_num FROM cuentas_bancarias;
        nuevo_id := 'CTA-BAN-' || LPAD((ultimo_num + 1)::TEXT, 3, '0');
        NEW.id_cuenta := nuevo_id;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_id_cuenta
BEFORE INSERT ON cuentas_bancarias
FOR EACH ROW
EXECUTE FUNCTION generar_id_cuenta();

-- Función y trigger para numero_pago en pagos_cabecera
CREATE OR REPLACE FUNCTION generar_numero_pago()
RETURNS TRIGGER AS $$
DECLARE
    nuevo_num VARCHAR(20);
    ultimo_num INT;
BEGIN
    IF NEW.numero_pago IS NULL THEN
        SELECT COALESCE(MAX(CAST(SUBSTRING(numero_pago, 9, 5) AS INT)), 0) INTO ultimo_num FROM pagos_cabecera;
        nuevo_num := 'PAG-CLI-' || LPAD((ultimo_num + 1)::TEXT, 5, '0');
        NEW.numero_pago := nuevo_num;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_numero_pago
BEFORE INSERT ON pagos_cabecera
FOR EACH ROW
EXECUTE FUNCTION generar_numero_pago();
