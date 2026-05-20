const express = require('express');
const { v4: uuidv4 } = require('uuid');
const db = require('../database/db');
const authMiddleware = require('../middleware/auth');

const router = express.Router();

function makeTxId() {
  return 'TXN-' + uuidv4().replace(/-/g, '').slice(0, 12).toUpperCase();
}

router.post('/initiate', (req, res) => {
  const { reference, method, phone } = req.body;
  if (!reference || !method) return res.status(400).json({ error: 'Référence et méthode requis' });

  const reservation = db.findOne('reservations', r => r.reference === reference);
  if (!reservation) return res.status(404).json({ error: 'Réservation introuvable' });
  if (reservation.payment_status === 'paye') return res.status(400).json({ error: 'Déjà payée' });

  const transaction_id = makeTxId();
  db.insert('payments', {
    reservation_id: reservation.id,
    method, phone: phone || null,
    amount: reservation.total_price,
    currency: 'XOF',
    transaction_id,
    status: 'en_attente'
  });

  const isMobile = ['orange_money', 'moov_money', 'telecel_money', 'coris_money'].includes(method);

  res.json({
    success: true,
    transaction_id,
    method,
    amount: reservation.total_price,
    phone,
    message: isMobile
      ? `Une demande de paiement a été envoyée au ${phone}. Veuillez valider sur votre téléphone.`
      : method === 'paypal'
        ? 'Vous allez être redirigé vers PayPal.'
        : 'Entrez vos coordonnées bancaires pour finaliser.',
    instructions: getInstructions(method, reservation.total_price),
    status: 'en_attente'
  });
});

router.post('/confirm', (req, res) => {
  const { transaction_id, operator_ref } = req.body;
  const payment = db.findOne('payments', p => p.transaction_id === transaction_id);
  if (!payment) return res.status(404).json({ error: 'Transaction introuvable' });

  db.updateWhere('payments', p => p.transaction_id === transaction_id, { status: 'paye', operator_ref: operator_ref || transaction_id });
  db.updateWhere('reservations', r => r.id === payment.reservation_id, { payment_status: 'paye', status: 'confirmee' });

  const reservation = db.findOne('reservations', r => r.id === payment.reservation_id);
  res.json({ success: true, message: 'Paiement confirmé', reference: reservation?.reference });
});

router.post('/webhook', (req, res) => {
  const { transaction_id, status, operator_ref } = req.body;
  const payment = db.findOne('payments', p => p.transaction_id === transaction_id);
  if (!payment) return res.sendStatus(200);

  if (['SUCCESS', 'SUCCESSFUL', 'COMPLETED'].includes(status)) {
    db.updateWhere('payments', p => p.transaction_id === transaction_id, { status: 'paye', operator_ref: operator_ref || '' });
    db.updateWhere('reservations', r => r.id === payment.reservation_id, { payment_status: 'paye', status: 'confirmee' });
  } else if (['FAILED', 'CANCELLED'].includes(status)) {
    db.updateWhere('payments', p => p.transaction_id === transaction_id, { status: 'echoue' });
  }
  res.sendStatus(200);
});

router.get('/status/:transaction_id', (req, res) => {
  const payment = db.findOne('payments', p => p.transaction_id === req.params.transaction_id);
  if (!payment) return res.status(404).json({ error: 'Transaction introuvable' });
  const reservation = db.findOne('reservations', r => r.id === payment.reservation_id);
  res.json({ ...payment, reservation });
});

router.get('/', authMiddleware, (req, res) => {
  const payments = db.findAll('payments');
  const reservations = db.findAll('reservations');
  const enriched = payments.map(p => {
    const r = reservations.find(res => res.id === p.reservation_id) || {};
    return { ...p, reference: r.reference || '–', client_name: r.client_name || '–', client_email: r.client_email || '–' };
  });
  enriched.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
  res.json(enriched);
});

router.post('/:id/refund', authMiddleware, (req, res) => {
  const payment = db.findOne('payments', p => p.id === Number(req.params.id));
  if (!payment) return res.status(404).json({ error: 'Paiement introuvable' });
  db.updateWhere('payments', p => p.id === payment.id, { status: 'rembourse' });
  db.updateWhere('reservations', r => r.id === payment.reservation_id, { payment_status: 'rembourse', status: 'annulee' });
  res.json({ message: 'Remboursement enregistré' });
});

function getInstructions(method, amount) {
  const fmt = Number(amount).toLocaleString('fr-FR');
  const map = {
    orange_money: `1. Composez *144# sur votre téléphone\n2. Sélectionnez "Payer une facture"\n3. Entrez le montant: ${fmt} FCFA\n4. Confirmez avec votre PIN Orange Money`,
    moov_money: `1. Composez *555# sur votre téléphone\n2. Sélectionnez "Paiement marchand"\n3. Entrez le montant: ${fmt} FCFA\n4. Confirmez avec votre PIN Moov Money`,
    telecel_money: `1. Composez *808# sur votre téléphone\n2. Sélectionnez "Paiement"\n3. Entrez le montant: ${fmt} FCFA\n4. Confirmez avec votre PIN Telecel Money`,
    coris_money: `1. Ouvrez l'application Coris Money\n2. Sélectionnez "Payer"\n3. Entrez le montant: ${fmt} FCFA\n4. Confirmez l'opération`
  };
  return map[method] || '';
}

module.exports = router;
