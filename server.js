const { createServer } = require('node:http');

const hostname = '127.0.0.1';
const port = 4000;

const server = createServer((req, res) => {
  res.statusCode = 200;
  res.setHeader('Content-Type', 'text/plain');
  res.end('Hola Mundo');
});

server.listen(port, hostname, () => {
  console.log(`Server corriendo en http://${hostname}:${port}/`);
});
