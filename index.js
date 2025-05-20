require('dotenv').config();
const express = require('express');
const swaggerJsdoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');
const cors = require('cors');
const app = express();

// Middlewares
app.use(cors());
app.use(express.json()); // Para parsear JSON

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
        url: `http://localhost:${process.env.PORT || 3000}`,
      },
    ],
  },
  apis: ['./routes/*.js'],
};
const swaggerSpec = swaggerJsdoc(swaggerOptions);
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// Rutas
const ejemploRoutes = require('./routes/ejemplo');
const clientesConSaldoRoutes = require('./routes/clientes_con_saldo');
const cuentasBancariasRoutes = require('./routes/cuentas_bancarias');

// Rutas de la API
app.use('/api', ejemploRoutes);
app.use('/api/clientes', clientesConSaldoRoutes);
app.use('/api/cuentas', cuentasBancariasRoutes);

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