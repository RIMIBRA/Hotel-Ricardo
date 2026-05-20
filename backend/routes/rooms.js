const express = require('express');
const db = require('../database/db');
const authMiddleware = require('../middleware/auth');

const router = express.Router();

function isBooked(roomId, checkIn, checkOut) {
  return db.findAll('reservations', r =>
    r.room_id === roomId &&
    !['annulee', 'refusee'].includes(r.status) &&
    !(r.check_out <= checkIn || r.check_in >= checkOut)
  ).length > 0;
}

router.get('/', (req, res) => {
  const { type, min_price, max_price, capacity, check_in, check_out } = req.query;
  let rooms = db.findAll('rooms', r => r.available === 1);

  if (type) rooms = rooms.filter(r => r.type === type);
  if (min_price) rooms = rooms.filter(r => r.price >= Number(min_price));
  if (max_price) rooms = rooms.filter(r => r.price <= Number(max_price));
  if (capacity) rooms = rooms.filter(r => r.capacity >= Number(capacity));
  if (check_in && check_out) rooms = rooms.filter(r => !isBooked(r.id, check_in, check_out));

  res.json(rooms);
});

router.get('/:id', (req, res) => {
  const room = db.findOne('rooms', r => r.id === Number(req.params.id));
  if (!room) return res.status(404).json({ error: 'Chambre introuvable' });
  res.json(room);
});

router.post('/', authMiddleware, (req, res) => {
  const { name, type, description, price, capacity, size, image, amenities, available } = req.body;
  if (!name || !type || !price) return res.status(400).json({ error: 'Champs requis manquants' });
  const room = db.insert('rooms', { name, type, description, price: Number(price), capacity: Number(capacity) || 2, size: size || '', image: image || '', amenities: amenities || [], available: available !== undefined ? available : 1 });
  res.status(201).json({ id: room.id, message: 'Chambre créée' });
});

router.put('/:id', authMiddleware, (req, res) => {
  const id = Number(req.params.id);
  const room = db.findOne('rooms', r => r.id === id);
  if (!room) return res.status(404).json({ error: 'Chambre introuvable' });
  const { name, type, description, price, capacity, size, image, amenities, available } = req.body;
  db.updateWhere('rooms', r => r.id === id, { name, type, description, price: Number(price), capacity: Number(capacity), size, image, amenities: amenities || [], available: available !== undefined ? Number(available) : room.available });
  res.json({ message: 'Chambre mise à jour' });
});

router.delete('/:id', authMiddleware, (req, res) => {
  db.updateWhere('rooms', r => r.id === Number(req.params.id), { available: 0 });
  res.json({ message: 'Chambre désactivée' });
});

module.exports = router;
