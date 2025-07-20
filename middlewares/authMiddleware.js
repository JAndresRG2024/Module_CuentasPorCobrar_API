const axios = require('axios');

// Middleware para obtener y validar el usuario desde el token
const authMiddleware = async (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    req.usuario = null; // No hay token
    return next();
  }

  const token = authHeader.split(' ')[1];

  try {
    // Este endpoint hay que reemplazar por el enpoint del módulo de seguridad que valida el token
    const response = await axios.get('https://aplicacion-de-seguridad-v2.onrender.com/api/usuarios/perfil', {
      headers: { Authorization: `Bearer ${token}` }
    });
    
    const usuario = response.data.usuario;

    req.usuario = {
      id: usuario.id_usuario,
      nombre: usuario.nombre,
      rol: usuario.nombre_rol
    };
  } catch (error) {
    console.warn('Token inválido o error al obtener usuario:', error.message);
    req.usuario = null;
  }

  next();
};

module.exports = authMiddleware;
