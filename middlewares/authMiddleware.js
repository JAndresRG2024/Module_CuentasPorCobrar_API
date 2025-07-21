const jwt = require('jsonwebtoken');

const SECRET_KEY = process.env.JWT_SECRET || 'mi_clave_ultra_segura';

const extraerToken = (req) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) return null;
  return authHeader.split(' ')[1];
};

const autenticarToken = (req, res, next) => {
  const token = extraerToken(req);
  if (!token) return res.status(401).json({ mensaje: 'Token no proporcionado' });

  try {
    const decoded = jwt.verify(token, SECRET_KEY);
    req.usuario = decoded; // El token ya contiene: id_usuario, usuario, nombre, nombre_rol

    // ✅ Mostrar datos del token para depuración
    console.log('🔐 Token recibido y decodificado correctamente:');
    console.log('🧑 Usuario:', decoded.usuario);
    console.log('🎭 Rol:', decoded.nombre_rol);
    console.log('🪪 ID Usuario:', decoded.id_usuario);
    
    next();
  } catch (err) {
    return res.status(401).json({ mensaje: 'Token inválido o expirado' });
  }
};

module.exports = {
  autenticarToken,
};
