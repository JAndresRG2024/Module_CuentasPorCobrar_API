const express = require('express');
const cors = require('cors');
const swaggerJsdoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');

const ejemploRoutes = require('../routes/ejemplo');
const pagosRouter = require('../routes/pagos');
const clientesConSaldoRoutes = require('../routes/clientes_con_saldo');
const cuentasBancariasRoutes = require('../routes/cuentas_bancarias');

const app = express();
app.use(cors());
app.use(express.json());

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
        url: 'https://module-cuentas-por-cobrar-api.vercel.app',
      },
    ],
  },
  apis: ['./routes/*.js'],
};
const swaggerSpec = swaggerJsdoc(swaggerOptions);
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

app.use('/api', ejemploRoutes);
app.use('/api/clientes', clientesConSaldoRoutes);
app.use('/api/cuentas', cuentasBancariasRoutes);
app.use('/api/pagos', pagosRouter);

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Error interno del servidor' });
});

module.exports = app;
module.exports.handler = (req, res) => app(req, res);