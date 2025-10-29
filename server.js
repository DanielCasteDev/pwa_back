const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

// Conexión a MongoDB (se mantiene activa)
const connectDB = async () => {
  try {
    const mongoURI = process.env.MONGODB_URI || 'mongodb://localhost:27017/pwa_back';
    await mongoose.connect(mongoURI);
    console.log('✅ Conectado a MongoDB');
  } catch (error) {
    console.error('❌ Error conectando a MongoDB:', error.message);
    process.exit(1);
  }
};

connectDB();

// Ruta mínima: Hola Mundo
app.get('/', (req, res) => {
  res.json({ mensaje: 'Hola Mundo!' });
});

// Rutas de autenticación
const authRoutes = require('./routes/auth');
app.use('/api/auth', authRoutes);

// Rutas de carrito
const cartRoutes = require('./routes/cart');
app.use('/api/cart', cartRoutes);

// Rutas de notificaciones push
const notificationRoutes = require('./routes/notifications');
app.use('/api/notifications', notificationRoutes);

app.listen(PORT, () => {
  console.log(`🚀 Servidor ejecutándose en http://localhost:${PORT}`);
});
