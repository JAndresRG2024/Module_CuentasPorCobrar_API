const express = require('express');
const swaggerJsdoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');
const cors = require('cors');
const app = express();

// Configuración de swagger-jsdoc
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
        url: 'http://localhost:3000',
      },
    ],
  },
  apis: ['./routes/*.js'], // Archivos donde se escriben las anotaciones
};

const swaggerSpec = swaggerJsdoc(swaggerOptions);

// Middleware de Swagger UI
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

app.use(cors());
// Rutas
const ejemploRoutes = require('./routes/ejemplo');
const clientesConSaldoRoutes = require('./routes/clientes_con_saldo');

app.use('/api', ejemploRoutes);
app.use('/clientes', clientesConSaldoRoutes);
// Iniciar servidor
const PORT = 3000;
app.listen(PORT, () => {
  console.log(`Servidor corriendo en: http://localhost:${PORT}`);
  console.log(`Documentación Swagger en: http://localhost:${PORT}/api-docs`);
});
