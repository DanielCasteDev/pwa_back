// Archivo de configuración de ejemplo
// Copia este archivo como .env en la raíz del proyecto

module.exports = {
  // MongoDB
  MONGODB_URI: 'mongodb://localhost:27017/pwa_back',
  
  // JWT Secret (cambiar en producción por una clave segura)
  JWT_SECRET: 'tu-clave-secreta-super-segura-aqui',
  
  // Puerto del servidor
  PORT: 3000,
  
  // Entorno
  NODE_ENV: 'development'
};
