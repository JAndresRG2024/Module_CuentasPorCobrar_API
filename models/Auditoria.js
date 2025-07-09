const axios = require("axios");

// URL DE LA API DE AUDITORÍA
const AUDITORIA_URL =
  "https://aplicacion-de-seguridad-v2.onrender.com/api/auditoria";

// Función genérica para enviar auditoría
const enviarAuditoria = async ({
  accion,
  modulo = "cuentas por cobrar",
  tabla = "pagos",
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

exports.enviarAuditoria = enviarAuditoria;