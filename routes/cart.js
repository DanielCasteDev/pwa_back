const express = require('express');
const Cart = require('../models/Cart');

const router = express.Router();

// Crear un carrito nuevo
router.post('/', async (req, res) => {
  try {
    const { items } = req.body;

    if (!Array.isArray(items)) {
      return res.status(400).json({ success: false, message: 'items debe ser un arreglo' });
    }

    const cart = await Cart.create({ items });
    return res.status(201).json({ success: true, cartId: cart._id, cart });
  } catch (error) {
    console.error('Create cart error:', error);
    return res.status(500).json({ success: false, message: 'Error creando el carrito' });
  }
});

// Sincronizar cola de carritos desde IndexedDB (batch)
router.post('/sync', async (req, res) => {
  try {
    const { items } = req.body;

    if (!Array.isArray(items)) {
      return res.status(400).json({ success: false, message: 'items debe ser un arreglo' });
    }

    // items puede venir en dos formatos:
    // 1) [{ action, product: {...}, quantity, createdAt, id }, ...]
    // 2) [{ items: [ { id, name, price, quantity, ... }, ... ] }, ...]
    // Fusionamos por product.id o id, sumando cantidades (add suma, remove resta)
    const mergedById = new Map();
    for (const record of items) {
      // Formato 1: con product anidado
      if (record && record.product && typeof record.product.id !== 'undefined') {
        const p = record.product;
        const key = p.id;
        const current = mergedById.get(key) || {
          id: p.id,
          name: p.name,
          price: Number(p.price),
          originalPrice: p.originalPrice,
          image: p.image,
          description: p.description,
          category: p.category,
          rating: p.rating,
          reviews: p.reviews,
          inStock: typeof p.inStock === 'boolean' ? p.inStock : true,
          features: Array.isArray(p.features) ? p.features : [],
          quantity: 0
        };
        const delta = Number(record.quantity || 0) * (record.action === 'remove' ? -1 : 1);
        current.quantity += isNaN(delta) ? 0 : delta;
        mergedById.set(key, current);
        continue;
      }

      // Formato 2: batch con items planos
      const list = Array.isArray(record && record.items) ? record.items : [];
      for (const it of list) {
        if (!it || typeof it.id === 'undefined') continue;
        const current = mergedById.get(it.id) || { ...it, quantity: 0 };
        const addQty = Number(it.quantity || 0);
        current.quantity += isNaN(addQty) ? 0 : addQty;
        current.price = Number(it.price ?? current.price);
        current.features = Array.isArray(it.features) ? it.features : (current.features || []);
        mergedById.set(it.id, current);
      }
    }

    const mergedItems = Array.from(mergedById.values()).filter(x => x.quantity > 0);

    const cart = await Cart.create({ items: mergedItems });
    return res.status(201).json({ success: true, cartId: cart._id, cart });
  } catch (error) {
    console.error('Sync cart error:', error);
    return res.status(500).json({ success: false, message: 'Error sincronizando el carrito' });
  }
});

// Obtener un carrito por ID
router.get('/:id', async (req, res) => {
  try {
    const cart = await Cart.findById(req.params.id);
    if (!cart) {
      return res.status(404).json({ success: false, message: 'Carrito no encontrado' });
    }
    return res.json({ success: true, cart });
  } catch (error) {
    console.error('Get cart error:', error);
    return res.status(500).json({ success: false, message: 'Error obteniendo el carrito' });
  }
});

module.exports = router;


