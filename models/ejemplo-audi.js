const { Proveedor, FacturaCompra } = require("../models");
const axios = require("axios");

// URL DE LA API DE AUDITORÍA
const AUDITORIA_URL =
  "https://aplicacion-de-seguridad-v2.onrender.com/api/auditoria";

// Función genérica para enviar auditoría
const enviarAuditoria = async ({
  accion,
  modulo = "compras",
  tabla = "proveedores",
  id_usuario = null,
  details = {},
  nombre_rol = "Sistema",
}) => {
  try {
    await axios.post(AUDITORIA_URL, {
      accion: accion.toUpperCase(), // fuerza a mayúsculas
      modulo,
      tabla,
      id_usuario,
      details,
      nombre_rol,
    });
  } catch (error) {
    console.warn("Error al enviar auditoría:", error.message);
  }
};

/* ------------------------------------------------------------------ */
/* CRUD + AUDITORÍA                                                   */
/* ------------------------------------------------------------------ */

// Listar todos los proveedores
exports.getAll = async (req, res) => {
  try {
    const proveedores = await Proveedor.findAll();

    await enviarAuditoria({
      accion: "CONSULTA",
      id_usuario: req.usuario?.id || null,
      details: { tipo: "listar todos los proveedores" },
      nombre_rol: req.usuario?.rol || "Sistema",
    });

    res.json(proveedores);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Obtener proveedor por ID
exports.getById = async (req, res) => {
  try {
    const { cedula_ruc } = req.params;
    const proveedor = await Proveedor.findByPk(cedula_ruc);
    if (!proveedor) {
      return res.status(404).json({ error: "Proveedor no encontrado" });
    }

    await enviarAuditoria({
      accion: "CONSULTA",
      id_usuario: req.usuario?.id || null,
      details: { tipo: "consulta individual", cedula_ruc },
      nombre_rol: req.usuario?.rol || "Sistema",
    });

    res.json(proveedor);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Crear proveedor
exports.create = async (req, res) => {
  try {
    const nuevo = await Proveedor.create(req.body);

    await enviarAuditoria({
      accion: "CREAR",
      id_usuario: req.usuario?.id || null,
      details: { antes: null, despues: nuevo },
      nombre_rol: req.usuario?.rol || "Sistema",
    });

    res.status(201).json(nuevo);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Actualizar proveedor
exports.update = async (req, res) => {
  try {
    const { cedula_ruc } = req.params;
    const proveedor = await Proveedor.findByPk(cedula_ruc);
    if (!proveedor) {
      return res
        .status(404)
        .json({ error: "Proveedor no encontrado para actualizar" });
    }

    const datosAntes = { ...proveedor.get() };
    await proveedor.update(req.body);

    await enviarAuditoria({
      accion: "ACTUALIZAR",
      id_usuario: req.usuario?.id || null,
      details: { antes: datosAntes, despues: req.body },
      nombre_rol: req.usuario?.rol || "Sistema",
    });

    res.json(proveedor);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Eliminar proveedor
exports.delete = async (req, res) => {
  try {
    const { cedula_ruc } = req.params;

    // Evitar borrar si posee facturas asociadas
    const facturas = await FacturaCompra.count({
      where: { proveedor_cedula_ruc: cedula_ruc },
    });
    if (facturas > 0) {
      return res.status(400).json({
        error:
          "No se puede eliminar el proveedor porque tiene facturas asociadas.",
      });
    }

    const borrado = await Proveedor.destroy({ where: { cedula_ruc } });
    if (!borrado) {
      return res.status(404).json({ error: "Proveedor no encontrado" });
    }

    await enviarAuditoria({
      accion: "ELIMINAR",
      id_usuario: req.usuario?.id || null,
      details: { eliminado: cedula_ruc },
      nombre_rol: req.usuario?.rol || "Sistema",
    });

    res.json({ message: "Proveedor eliminado correctamente" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};