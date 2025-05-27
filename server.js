const express = require('express');
const mongoose = require('mongoose');
const swaggerJsdoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');
const usuarioRouter = require('./routes/usuario');
const cors = require('cors');
const client = require('prom-client'); // ← Prometheus

require('dotenv').config();

const app = express();
app.use(express.json());
app.use(cors());

// ──────── PROMETHEUS SETUP ────────

// Recolecta métricas por defecto (CPU, memoria, etc.)
client.collectDefaultMetrics();

// Métrica: duración de peticiones HTTP
const httpRequestDurationMicroseconds = new client.Histogram({
  name: 'http_request_duration_ms',
  help: 'Duración de las peticiones HTTP en milisegundos',
  labelNames: ['method', 'route', 'status_code'],
  buckets: [50, 100, 200, 300, 400, 500, 1000]
});

// Middleware para medir duración de las peticiones
app.use((req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    const duration = Date.now() - start;
    httpRequestDurationMicroseconds
      .labels(req.method, req.route?.path || req.path, res.statusCode)
      .observe(duration);
  });
  next();
});

// Endpoint para Prometheus
app.get('/metrics', async (req, res) => {
  res.set('Content-Type', client.register.contentType);
  res.end(await client.register.metrics());
});

// ──────── CONEXIÓN A BASE DE DATOS ────────

const hostname = '127.0.0.1';
const port = 4000;

mongoose.connect('mongodb://localhost:27017/Usuarios');
const connection = mongoose.connection;

connection.once('open', () => {
  console.log('Conexión a la BD');
});

connection.on('error', (err) => {
  console.log('Error en conectar: ', err);
});

// ──────── SWAGGER ────────

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

// ──────── RUTAS ────────

app.use('/usuarios', usuarioRouter);

// ──────── SERVIDOR ────────

app.listen(port, hostname, () => {
  console.log(`Server corriendo en http://${hostname}:${port}/`);
  console.log(`Swagger disponible en http://${hostname}:${port}/api-docs`);
  console.log(`Métricas disponibles en http://${hostname}:${port}/metrics`);
});
