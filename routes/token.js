const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');

const SECRET_KEY = process.env.JWT_SECRET || 'mi_clave_ultra_segura';

// Extraer token del header
function extraerToken(req) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) return null;
  return authHeader.split(' ')[1];
}

// Ruta para verificar validez del token
router.get('/token/valido', (req, res) => {
  const token = extraerToken(req);
  if (!token) return res.status(401).json({ valido: false, error: 'Token no proporcionado' });

  try {
    const decoded = jwt.verify(token, SECRET_KEY);
    res.json({ valido: true, usuario: decoded });
  } catch (err) {
    res.status(401).json({ valido: false, error: 'Token inválido o expirado' });
  }
});

module.exports = router;
