const mongoose = require('mongoose');

const cartItemSchema = new mongoose.Schema({
  id: { type: Number, required: true },
  name: { type: String, required: true },
  price: { type: Number, required: true },
  originalPrice: { type: Number },
  image: { type: String },
  description: { type: String },
  category: { type: String },
  rating: { type: Number },
  reviews: { type: Number },
  inStock: { type: Boolean, default: true },
  features: { type: [String], default: [] },
  quantity: { type: Number, required: true, min: 0 }
}, { _id: false });

const cartSchema = new mongoose.Schema({
  items: { type: [cartItemSchema], required: true, default: [] },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Cart', cartSchema);


