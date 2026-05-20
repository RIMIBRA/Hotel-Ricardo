const express = require('express');
const { v4: uuidv4 } = require('uuid');
const db = require('../database/db');
const authMiddleware = require('../middleware/auth');

const router = express.Router();

function generateRef() {
  const d = new Date();
  const y = d.getFullYear().toString().slice(-2);
  const m = String(d.getMonth() + 1).padStart(2, '0');
  return `RIC-${y}${m}-${Math.floor(1000 + Math.random() * 9000)}`;
}

function calcNights(ci, co) {
  return Math.ceil((new Date(co) - new Date(ci)) / 86400000);
}

function hasConflict(roomId, checkIn, checkOut, excludeId) {
  return db.findAll('reservations', r =>
    r.room_id === roomId &&
    r.id !== excludeId &&
    !['annulee', 'refusee'].includes(r.status) &&
    !(r.check_out <= checkIn || r.check_in >= checkOut)
  ).length > 0;
}

router.get('/', authMiddleware, (req, res) => {
  const { status, search } = req.query;
  let list = db.findAll('reservations');
  if (status) list = list.filter(r => r.status === status);
  if (search) {
    const s = search.toLowerCase();
    list = list.filter(r => r.client_name?.toLowerCase().includes(s) || r.client_email?.toLowerCase().includes(s) || r.reference?.toLowerCase().includes(s));
  }
  list.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
  // Join room name
  const rooms = db.findAll('rooms');
  list = list.map(r => {
    const room = rooms.find(rm => rm.id === r.room_id) || {};
    return { ...r, room_name: room.name || '–', room_type: room.type || '–' };
  });
  res.json(list);
});

router.get('/check', (req, res) => {
  const { room_id, check_in, check_out } = req.query;
  if (!room_id || !check_in || !check_out) return res.status(400).json({ error: 'Paramètres manquants' });
  res.json({ available: !hasConflict(Number(room_id), check_in, check_out, null) });
});

router.get('/:ref', (req, res) => {
  const r = db.findOne('reservations', res => res.reference === req.params.ref);
  if (!r) return res.status(404).json({ error: 'Réservation introuvable' });
  const room = db.findOne('rooms', rm => rm.id === r.room_id) || {};
  const payments = db.findAll('payments', p => p.reservation_id === r.id);
  res.json({ ...r, room_name: room.name || '–', room_image: room.image || '', payments });
});

router.post('/', (req, res) => {
  const { client_name, client_email, client_phone, room_id, check_in, check_out, guests, breakfast, special_requests } = req.body;
  if (!client_name || !client_email || !client_phone || !room_id || !check_in || !check_out)
    return res.status(400).json({ error: 'Tous les champs obligatoires doivent être remplis' });

  const room = db.findOne('rooms', r => r.id === Number(room_id) && r.available === 1);
  if (!room) return res.status(404).json({ error: 'Chambre introuvable ou indisponible' });

  if (hasConflict(Number(room_id), check_in, check_out, null))
    return res.status(409).json({ error: "Cette chambre n'est pas disponible pour ces dates" });

  const nights = calcNights(check_in, check_out);
  if (nights < 1) return res.status(400).json({ error: 'Dates invalides' });

  const breakfastTotal = breakfast ? (Number(guests) || 1) * nights * 4000 : 0;
  const total_price = room.price * nights + breakfastTotal;
  const reference = generateRef();

  const reservation = db.insert('reservations', {
    reference, client_name, client_email, client_phone,
    room_id: Number(room_id), check_in, check_out,
    guests: Number(guests) || 1, nights, room_price: room.price, total_price,
    breakfast: breakfast ? 1 : 0, breakfast_total: breakfastTotal,
    special_requests: special_requests || '',
    status: 'en_attente', payment_status: 'non_paye'
  });

  res.status(201).json({ id: reservation.id, reference, total_price, nights, room_name: room.name, message: 'Réservation créée. Veuillez procéder au paiement.' });
});

router.put('/:id/status', authMiddleware, (req, res) => {
  const { status } = req.body;
  const valid = ['en_attente', 'confirmee', 'annulee', 'refusee', 'terminee'];
  if (!valid.includes(status)) return res.status(400).json({ error: 'Statut invalide' });
  db.updateWhere('reservations', r => r.id === Number(req.params.id), { status });
  res.json({ message: 'Statut mis à jour' });
});

router.delete('/:id', authMiddleware, (req, res) => {
  db.updateWhere('reservations', r => r.id === Number(req.params.id), { status: 'annulee' });
  res.json({ message: 'Réservation annulée' });
});

module.exports = router;
