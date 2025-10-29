const express = require('express');
const webpush = require('web-push');
const Subscription = require('../models/Subscription');
const authenticateToken = require('../middleware/auth');
const router = express.Router();

// 🔑 Claves VAPID específicas para pwa_back
const vapidKeys = {
  publicKey: "BA0QfSuyhYW-m1x5YfN26hbr2wC1J5SLzT3_mRI3d0BOreMLoJN7bktyihkny_gh2XQ0uK9C7yRsOY7dWoI_UYE",
  privateKey: "BHLMPrFPA7CJ2Poxs-mjBLB_c5iToK_fnBIung-ASAE"
};

webpush.setVapidDetails(
  "mailto:tuemail@ejemplo.com",
  vapidKeys.publicKey,
  vapidKeys.privateKey
);

// 📬 Guardar suscripción (requiere autenticación)
router.post('/subscribe', authenticateToken, async (req, res) => {
  try {
    const subscription = req.body;
    const userId = req.user.id;
    
    // Guardar o actualizar suscripción asociada al usuario
    await Subscription.findOneAndUpdate(
      { endpoint: subscription.endpoint },
      {
        userId,
        ...subscription,
        userAgent: req.get('User-Agent'),
        lastUsed: new Date()
      },
      { upsert: true, new: true }
    );

    console.log(`✅ Suscripción guardada para usuario ${req.user.email}:`, subscription.endpoint);
    res.status(201).json({ 
      success: true, 
      message: 'Suscripción guardada correctamente' 
    });
  } catch (error) {
    console.error('❌ Error guardando suscripción:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error guardando suscripción' 
    });
  }
});

// 🚀 Enviar notificación al usuario actual
router.post('/send-notification', authenticateToken, async (req, res) => {
  try {
    const { title, body, icon, badge, data } = req.body;
    const userId = req.user.id;

    const payload = JSON.stringify({
      title: title || 'TechStore Notificación',
      body: body || 'Tienes una nueva notificación',
      icon: icon || '/favicon.ico',
      badge: badge || '/favicon.ico',
      data: data || {}
    });

    // Buscar solo las suscripciones del usuario actual
    const subscriptions = await Subscription.find({ userId });
    let successCount = 0;
    let errorCount = 0;

    if (subscriptions.length === 0) {
      return res.json({
        success: true,
        message: 'No hay suscripciones activas para este usuario',
        stats: {
          total: 0,
          success: 0,
          errors: 0
        }
      });
    }

    for (const sub of subscriptions) {
      try {
        await webpush.sendNotification(sub, payload);
        successCount++;
        
        // Actualizar lastUsed
        await Subscription.findByIdAndUpdate(sub._id, { lastUsed: new Date() });
      } catch (error) {
        errorCount++;
        console.error('❌ Error enviando notificación:', error);
        
        // Si la suscripción es inválida, eliminarla
        if (error.statusCode === 410) {
          await Subscription.findByIdAndDelete(sub._id);
          console.log('🗑️ Suscripción inválida eliminada:', sub.endpoint);
        }
      }
    }

    console.log(`📤 Notificaciones enviadas al usuario ${req.user.email}: ${successCount} exitosas, ${errorCount} errores`);
    
    res.json({
      success: true,
      message: `Notificaciones enviadas: ${successCount} exitosas, ${errorCount} errores`,
      stats: {
        total: subscriptions.length,
        success: successCount,
        errors: errorCount
      }
    });
  } catch (error) {
    console.error('❌ Error enviando notificaciones:', error);
    res.status(500).json({
      success: false,
      message: 'Error enviando notificaciones'
    });
  }
});

// 📊 Obtener estadísticas de suscripciones
router.get('/stats', async (req, res) => {
  try {
    const total = await Subscription.countDocuments();
    const recent = await Subscription.countDocuments({
      lastUsed: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) }
    });

    res.json({
      success: true,
      stats: {
        total,
        recent,
        inactive: total - recent
      }
    });
  } catch (error) {
    console.error('❌ Error obteniendo estadísticas:', error);
    res.status(500).json({
      success: false,
      message: 'Error obteniendo estadísticas'
    });
  }
});

// 🛒 Enviar notificación cuando se agrega producto al carrito (solo al usuario actual)
router.post('/cart-notification', authenticateToken, async (req, res) => {
  try {
    const { productName, productPrice, cartCount, cartTotal } = req.body;
    const userId = req.user.id;

    const payload = JSON.stringify({
      title: '🛒 Producto agregado al carrito',
      body: `${productName} - ${productPrice} (${cartCount} items en carrito)`,
      icon: '/favicon.ico',
      badge: '/favicon.ico',
      data: {
        type: 'cart',
        productName,
        productPrice,
        cartCount,
        cartTotal,
        url: '/',
        timestamp: Date.now()
      }
    });

    // Buscar solo las suscripciones del usuario actual
    const subscriptions = await Subscription.find({ userId });
    let successCount = 0;
    let errorCount = 0;

    if (subscriptions.length === 0) {
      return res.json({
        success: true,
        message: 'No hay suscripciones activas para este usuario',
        stats: {
          total: 0,
          success: 0,
          errors: 0
        }
      });
    }

    for (const sub of subscriptions) {
      try {
        await webpush.sendNotification(sub, payload);
        successCount++;
        
        // Actualizar lastUsed
        await Subscription.findByIdAndUpdate(sub._id, { lastUsed: new Date() });
      } catch (error) {
        errorCount++;
        console.error('❌ Error enviando notificación de carrito:', error);
        
        // Si la suscripción es inválida, eliminarla
        if (error.statusCode === 410) {
          await Subscription.findByIdAndDelete(sub._id);
          console.log('🗑️ Suscripción inválida eliminada:', sub.endpoint);
        }
      }
    }

    console.log(`🛒 Notificación enviada al usuario ${req.user.email}: ${successCount} exitosas, ${errorCount} errores`);
    
    res.json({
      success: true,
      message: `Notificación de carrito enviada: ${successCount} exitosas, ${errorCount} errores`,
      stats: {
        total: subscriptions.length,
        success: successCount,
        errors: errorCount
      }
    });
  } catch (error) {
    console.error('❌ Error enviando notificación de carrito:', error);
    res.status(500).json({
      success: false,
      message: 'Error enviando notificación de carrito'
    });
  }
});

// 🔑 Obtener clave pública VAPID
router.get('/vapid-public-key', (req, res) => {
  res.json({
    success: true,
    publicKey: vapidKeys.publicKey
  });
});

module.exports = router;
