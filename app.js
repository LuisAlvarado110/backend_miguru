const express = require('express');
const mongoose = require('mongoose');
const swaggerJsdoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');
const usuarioRouter = require('./routes/usuario');
const cors = require('cors');
const client = require('prom-client');
require('dotenv').config();

const app = express();
app.use(express.json());
app.use(cors());

const hostname = '127.0.0.1';
const port = 4000;


const register = new client.Registry();


client.collectDefaultMetrics({ register });

// Métrica para total de solicitudes HTTP
const httpRequestsTotal = new client.Counter({
  name: 'http_requests_total',
  help: 'Número total de solicitudes HTTP',
  labelNames: ['method', 'route', 'status'],
});
register.registerMetric(httpRequestsTotal);

// Métrica para duración de solicitudes HTTP en segundos
const httpRequestDuration = new client.Histogram({
  name: 'http_request_duration_seconds',
  help: 'Duración de solicitudes HTTP en segundos',
  labelNames: ['method', 'route', 'status'],
  buckets: [0.1, 0.3, 0.5, 1, 2, 5],
});
register.registerMetric(httpRequestDuration);

// Middleware para contar y medir tiempo de solicitudes HTTP
app.use((req, res, next) => {
  const end = httpRequestDuration.startTimer();
  res.on('finish', () => {
    const route = req.route?.path || req.path;
    httpRequestsTotal.labels(req.method, route, res.statusCode.toString()).inc();
    end({ method: req.method, route, status: res.statusCode.toString() });
  });
  next();
});


app.get('/metrics', async (req, res) => {
  res.set('Content-Type', register.contentType);
  res.end(await register.metrics());
});

mongoose.connect('mongodb://localhost:27017/Usuarios');
const connection = mongoose.connection;

connection.once('open', () => {
  console.log('Conexión a la BD');
});

connection.on('error', (err) => {
  console.log('Error en conectar: ', err);
});

const swaggerOptions = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'API de Usuarios',
      version: '1.0.0',
      description: 'Documentación de la API de Usuarios con Express y MongoDB',
    },
  },
  apis: ['./routes/usuario.js'],
};

const swaggerDocs = swaggerJsdoc(swaggerOptions);
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocs));


app.use('/usuarios', usuarioRouter);


app.listen(port, hostname, () => {
  console.log(`Server corriendo en http://${hostname}:${port}/`);
  console.log(`Swagger disponible en http://${hostname}:${port}/api-docs`);
  console.log(`Métricas Prometheus en http://${hostname}:${port}/metrics`);
});
