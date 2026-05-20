const express = require('express');
const db = require('../database/db');
const authMiddleware = require('../middleware/auth');

const router = express.Router();

function today() { return new Date().toISOString().slice(0, 10); }

router.get('/stats', authMiddleware, (req, res) => {
  const reservations = db.findAll('reservations');
  const payments = db.findAll('payments');
  const rooms = db.findAll('rooms', r => r.available === 1);
  const messages = db.findAll('contact_messages');

  const todayStr = today();

  const stats = {
    totalReservations: reservations.length,
    confirmedReservations: reservations.filter(r => r.status === 'confirmee').length,
    pendingReservations: reservations.filter(r => r.status === 'en_attente').length,
    totalRevenue: payments.filter(p => p.status === 'paye').reduce((s, p) => s + p.amount, 0),
    totalRooms: rooms.length,
    unreadMessages: messages.filter(m => !m.read).length,
    todayCheckins: reservations.filter(r => r.check_in === todayStr && r.status === 'confirmee').length,
    todayCheckouts: reservations.filter(r => r.check_out === todayStr && r.status === 'confirmee').length
  };

  // Revenue by method
  const methodMap = {};
  payments.filter(p => p.status === 'paye').forEach(p => {
    if (!methodMap[p.method]) methodMap[p.method] = { method: p.method, total: 0, count: 0 };
    methodMap[p.method].total += p.amount;
    methodMap[p.method].count++;
  });
  const revenueByMethod = Object.values(methodMap);

  // Last 7 days
  const last7days = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date(); d.setDate(d.getDate() - i);
    const dateStr = d.toISOString().slice(0, 10);
    const dayRes = reservations.filter(r => r.created_at?.slice(0, 10) === dateStr);
    last7days.push({ date: dateStr, reservations: dayRes.length, revenue: dayRes.reduce((s, r) => s + r.total_price, 0) });
  }

  // Recent reservations
  const roomsMap = {};
  db.findAll('rooms').forEach(r => { roomsMap[r.id] = r; });
  const recentReservations = reservations
    .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
    .slice(0, 10)
    .map(r => ({ ...r, room_name: roomsMap[r.room_id]?.name || '–' }));

  // Room occupancy
  const roomOccupancy = rooms.map(room => {
    const roomRes = reservations.filter(r => r.room_id === room.id);
    const confirmedRes = roomRes.filter(r => r.status === 'confirmee');
    return { name: room.name, type: room.type, price: room.price, total_reservations: roomRes.length, nights_booked: confirmedRes.reduce((s, r) => s + r.nights, 0) };
  }).sort((a, b) => b.total_reservations - a.total_reservations);

  res.json({ stats, revenueByMethod, last7days, recentReservations, roomOccupancy });
});

router.get('/messages', authMiddleware, (req, res) => {
  const msgs = db.findAll('contact_messages');
  msgs.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
  res.json(msgs);
});

router.put('/messages/:id/read', authMiddleware, (req, res) => {
  db.updateWhere('contact_messages', m => m.id === Number(req.params.id), { read: 1 });
  res.json({ message: 'Message marqué comme lu' });
});

router.post('/contact', (req, res) => {
  const { name, email, subject, message } = req.body;
  if (!name || !email || !message) return res.status(400).json({ error: 'Champs requis manquants' });
  db.insert('contact_messages', { name, email, subject: subject || '', message, read: 0 });
  res.json({ message: 'Votre message a été envoyé. Nous vous répondrons dans les plus brefs délais.' });
});

module.exports = router;
