require('dotenv').config();
const express = require('express');
const swaggerJsdoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');
const cors = require('cors');
const app = express();
const {autenticarToken} = require('./middlewares/authMiddleware');
const tokenRoutes = require('./routes/token');
// Middlewares
app.use(cors());
app.use(express.json()); // Para parsear JSON
app.use('/pdfs', express.static('pdfs'));
// Ruta pública para validar token
app.use('/api', tokenRoutes);

// Swagger config
const swaggerOptions = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'API Del Modulo Cuentas Por Cobrar',
      version: '1.0.0',
      description: 'Documentación de la API generada con JSDoc',
    },
    servers: [
      {
        url: process.env.SWAGGER_SERVER_URL || `http://localhost:${process.env.PORT || 3000}`,
      },
    ],
  },
  apis: ['./routes/*.js'],
};
const swaggerSpec = swaggerJsdoc(swaggerOptions);
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// Rutas
const clientesRoutes = require('./routes/clientes');
const PagosDetalleRouter = require('./routes/pagos_detalles');
const cuentasBancariasRoutes = require('./routes/cuentas_bancarias');
const facturasRoutes = require('./routes/facturas');

const pagosRouter = require('./routes/pagos');

// PDF antes del JSON middleware (si la ruta usa streams binarios directamente)
app.use('/api/pagos', autenticarToken, pagosRouter); // ← aquí van las rutas PDF


// Rutas de la API
app.use('/api/clientes', clientesRoutes);
app.use('/api/cuentas', autenticarToken, cuentasBancariasRoutes);
app.use('/api/pagos-detalle', autenticarToken, PagosDetalleRouter);
app.use('/api/facturas', autenticarToken, facturasRoutes);

// Manejo de errores global
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Error interno del servidor' });
});

// Iniciar servidor
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Servidor corriendo en: http://localhost:${PORT}`);
  console.log(`Documentación Swagger en: http://localhost:${PORT}/api-docs`);
});