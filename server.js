const express = require('express');
const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

app.get('/', (req, res) => {
  res.json({ 
    mensaje: 'Hola Mundo!',
    timestamp: new Date().toISOString(),
    servidor: 'Express API funcionando correctamente'
  });
});

app.get('/health', (req, res) => {
  res.json({ 
    status: 'OK',
    uptime: process.uptime(),
    timestamp: new Date().toISOString()
  });
});

app.listen(PORT, () => {
  console.log(` Servidor ejecutándose en http://localhost:${PORT}`);
  console.log(` API disponible en http://localhost:${PORT}/`);
  console.log(` Health check en http://localhost:${PORT}/health`);
});
