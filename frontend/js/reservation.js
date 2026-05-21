const API = 'https://hotel-ricardo.onrender.com/api';
let reservationData = {};
let currentPaymentMethod = null;
let currentTransactionId = null;

// ── CHARGER LES CHAMBRES ──────────────────────────────────
async function loadRoomOptions() {
  try {
    const r = await fetch(`${API}/rooms`);
    const rooms = await r.json();
    const sel = document.getElementById('roomSelect');
    rooms.forEach(room => {
      const opt = document.createElement('option');
      opt.value = room.id;
      opt.textContent = `${room.name} — ${Number(room.price).toLocaleString('fr-FR')} FCFA/nuit (${room.capacity} pers. max)`;
      opt.dataset.price = room.price;
      opt.dataset.capacity = room.capacity;
      opt.dataset.name = room.name;
      sel.appendChild(opt);
    });
    // Pré-sélectionner si paramètre URL
    const params = new URLSearchParams(window.location.search);
    const roomId = params.get('room');
    if (roomId) { sel.value = roomId; sel.dispatchEvent(new Event('change')); }
  } catch { console.warn('Backend non disponible'); }
}

// ── CALCUL PRIX ───────────────────────────────────────────
function updatePriceSummary() {
  const sel = document.getElementById('roomSelect');
  const checkIn = document.getElementById('checkIn').value;
  const checkOut = document.getElementById('checkOut').value;
  const guests = parseInt(document.getElementById('guestsSelect').value) || 1;
  const breakfast = document.getElementById('breakfastCheck').checked;

  const opt = sel.options[sel.selectedIndex];
  if (!opt || !opt.dataset.price || !checkIn || !checkOut) return;

  const pricePerNight = parseInt(opt.dataset.price);
  const d1 = new Date(checkIn), d2 = new Date(checkOut);
  const nights = Math.ceil((d2 - d1) / 86400000);
  if (nights < 1) return;

  const roomTotal = pricePerNight * nights;
  const breakfastTotal = breakfast ? guests * nights * 4000 : 0;
  const total = roomTotal + breakfastTotal;

  document.getElementById('summaryRoom').textContent = opt.dataset.name || '–';
  document.getElementById('summaryIn').textContent = formatDateFR(checkIn);
  document.getElementById('summaryOut').textContent = formatDateFR(checkOut);
  document.getElementById('summaryNights').textContent = nights + (nights > 1 ? ' nuits' : ' nuit');
  document.getElementById('summaryPricePerNight').textContent = formatCFA(pricePerNight);
  document.getElementById('summaryTotal').textContent = formatCFA(total);
  document.getElementById('payAmountBtn').textContent = Number(total).toLocaleString('fr-FR');

  if (breakfast && breakfastTotal > 0) {
    document.getElementById('breakfastLine').style.display = 'flex';
    document.getElementById('summaryBreakfast').textContent = formatCFA(breakfastTotal);
  } else {
    document.getElementById('breakfastLine').style.display = 'none';
  }

  reservationData.total_price = total;
  reservationData.nights = nights;
  reservationData.pricePerNight = pricePerNight;
  reservationData.roomName = opt.dataset.name;
}

// ── STEPPER ───────────────────────────────────────────────
function goToStep1() {
  document.getElementById('step2').classList.add('hidden');
  document.getElementById('step1').classList.remove('hidden');
  setStepActive(1);
}

async function goToStep2() {
  const roomId = document.getElementById('roomSelect').value;
  const checkIn = document.getElementById('checkIn').value;
  const checkOut = document.getElementById('checkOut').value;

  if (!roomId || !checkIn || !checkOut) {
    showAlert('availabilityMsg', 'Veuillez sélectionner une chambre et des dates.', 'error');
    return;
  }
  if (checkOut <= checkIn) {
    showAlert('availabilityMsg', 'La date de départ doit être après la date d\'arrivée.', 'error');
    return;
  }

  // Vérifier disponibilité
  try {
    const r = await fetch(`${API}/reservations/check?room_id=${roomId}&check_in=${checkIn}&check_out=${checkOut}`);
    const data = await r.json();
    if (!data.available) {
      showAlert('availabilityMsg', 'Cette chambre n\'est pas disponible pour les dates sélectionnées.', 'error');
      return;
    }
  } catch { /* pas de serveur, on continue quand même */ }

  reservationData.room_id = roomId;
  reservationData.check_in = checkIn;
  reservationData.check_out = checkOut;
  reservationData.guests = parseInt(document.getElementById('guestsSelect').value);
  reservationData.breakfast = document.getElementById('breakfastCheck').checked;

  document.getElementById('availabilityMsg').innerHTML = '';
  document.getElementById('step1').classList.add('hidden');
  document.getElementById('step2').classList.remove('hidden');
  setStepActive(2);
}

async function submitReservation() {
  const name = document.getElementById('clientName').value.trim();
  const email = document.getElementById('clientEmail').value.trim();
  const phone = document.getElementById('clientPhone').value.trim();

  if (!name || !email || !phone) {
    showAlert('alertStep2', 'Veuillez remplir tous les champs obligatoires.', 'error');
    return;
  }

  const btn = document.getElementById('btnStep2');
  btn.disabled = true;
  btn.innerHTML = '<div class="spinner"></div> Enregistrement...';

  const payload = {
    ...reservationData,
    client_name: name,
    client_email: email,
    client_phone: phone,
    special_requests: document.getElementById('specialRequests').value
  };

  try {
    const r = await fetch(`${API}/reservations`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    const data = await r.json();
    if (!r.ok) throw new Error(data.error || 'Erreur');

    reservationData.reference = data.reference;
    reservationData.total_price = data.total_price;
    reservationData.room_name = data.room_name;

    document.getElementById('step2').classList.add('hidden');
    document.getElementById('step3').classList.remove('hidden');
    setStepActive(3);
  } catch (e) {
    showAlert('alertStep2', e.message, 'error');
  }

  btn.disabled = false;
  btn.innerHTML = '<i class="fas fa-lock"></i> Confirmer la réservation';
}

// ── PAIEMENT ──────────────────────────────────────────────
function selectPayment(card, method) {
  document.querySelectorAll('.payment-method-card').forEach(c => c.classList.remove('selected'));
  card.classList.add('selected');
  currentPaymentMethod = method;
  document.getElementById('btnPay').disabled = false;

  const area = document.getElementById('paymentFormArea');
  const isMobile = ['orange_money', 'moov_money', 'telecel_money', 'coris_money'].includes(method);

  if (isMobile) {
    const labels = { orange_money: 'Orange Money (*144#)', moov_money: 'Moov Money (*555#)', telecel_money: 'Telecel Money (*808#)', coris_money: 'Coris Money' };
    area.innerHTML = `
      <p style="font-size:13px;color:var(--text-light);margin-bottom:14px">Entrez votre numéro ${labels[method]} pour recevoir la demande de paiement.</p>
      <div class="form-group">
        <label>Numéro de téléphone *</label>
        <input type="tel" id="payPhone" placeholder="+226 70 XX XX XX" style="width:100%">
      </div>
    `;
  } else if (method === 'stripe') {
    area.innerHTML = `
      <p style="font-size:13px;color:var(--text-light);margin-bottom:14px">Entrez vos coordonnées bancaires.</p>
      <div class="form-group" style="margin-bottom:14px">
        <label>Numéro de carte *</label>
        <input type="text" placeholder="1234 5678 9012 3456" maxlength="19" id="cardNumber" style="width:100%;font-family:monospace">
      </div>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px">
        <div class="form-group">
          <label>Expiration *</label>
          <input type="text" placeholder="MM/AA" maxlength="5" id="cardExpiry" style="width:100%">
        </div>
        <div class="form-group">
          <label>CVV *</label>
          <input type="text" placeholder="123" maxlength="4" id="cardCvv" style="width:100%">
        </div>
      </div>
      <div class="form-group" style="margin-top:12px">
        <label>Nom sur la carte *</label>
        <input type="text" placeholder="JEAN DUPONT" id="cardName" style="width:100%">
      </div>
      <p style="font-size:11px;color:var(--text-light);margin-top:10px"><i class="fas fa-lock"></i> Paiement sécurisé SSL — vos données ne sont jamais stockées</p>
    `;
  } else if (method === 'paypal') {
    area.innerHTML = `
      <div style="text-align:center;padding:20px">
        <div style="font-size:40px;margin-bottom:12px">🅿️</div>
        <p style="font-size:14px;color:var(--text-light)">Vous serez redirigé vers PayPal pour compléter le paiement en toute sécurité.</p>
      </div>
    `;
  }
}

async function processPayment() {
  const method = currentPaymentMethod;
  if (!method) return;

  const phone = document.getElementById('payPhone')?.value?.trim();
  const isMobile = ['orange_money', 'moov_money', 'telecel_money', 'coris_money'].includes(method);

  if (isMobile && !phone) {
    showAlert('alertStep3', 'Veuillez entrer votre numéro de téléphone.', 'error');
    return;
  }

  const btn = document.getElementById('btnPay');
  btn.disabled = true;
  btn.innerHTML = '<div class="spinner"></div> Traitement...';

  try {
    const r = await fetch(`${API}/payments/initiate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ reference: reservationData.reference, method, phone })
    });
    const data = await r.json();
    if (!r.ok) throw new Error(data.error || 'Erreur');

    currentTransactionId = data.transaction_id;
    openPaymentModal(data);
  } catch (e) {
    // Mode démo sans backend
    currentTransactionId = 'TXN-DEMO-' + Date.now();
    openPaymentModal({ transaction_id: currentTransactionId, message: 'Simulation de paiement activée.', instructions: getLocalInstructions(method, reservationData.total_price) });
  }

  btn.disabled = false;
  btn.innerHTML = `<i class="fas fa-lock"></i> Payer ${Number(reservationData.total_price||0).toLocaleString('fr-FR')} FCFA`;
}

function openPaymentModal(data) {
  const isMobile = ['orange_money', 'moov_money', 'telecel_money', 'coris_money'].includes(currentPaymentMethod);
  document.getElementById('payModalTitle').textContent = isMobile ? 'Validation requise' : 'Traitement en cours...';
  document.getElementById('payModalMsg').textContent = data.message || 'Veuillez patienter...';
  if (data.instructions) {
    const el = document.getElementById('payModalInstruction');
    el.textContent = data.instructions;
    el.style.display = 'block';
  }
  document.getElementById('paymentModal').classList.add('open');
}

function closePaymentModal() {
  document.getElementById('paymentModal').classList.remove('open');
}

async function simulatePaymentSuccess() {
  document.getElementById('payModalIcon').textContent = '✅';
  document.getElementById('payModalTitle').textContent = 'Paiement confirmé !';
  document.getElementById('payModalMsg').textContent = 'Votre réservation est maintenant confirmée.';
  document.getElementById('btnSimulate').style.display = 'none';

  try {
    await fetch(`${API}/payments/confirm`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ transaction_id: currentTransactionId })
    });
  } catch { /* mode démo */ }

  setTimeout(() => {
    closePaymentModal();
    showSuccess();
  }, 1500);
}

function showSuccess() {
  document.getElementById('step3').classList.add('hidden');
  document.getElementById('stepSuccess').classList.remove('hidden');
  document.getElementById('successRef').textContent = reservationData.reference || 'RIC-DEMO-0001';
  document.getElementById('successRoom').textContent = reservationData.room_name || reservationData.roomName || '–';
  document.getElementById('successAmount').textContent = formatCFA(reservationData.total_price || 0);
}

// ── HELPERS ───────────────────────────────────────────────
function setStepActive(n) {
  [1, 2, 3].forEach(i => {
    const circle = document.getElementById(`step${i}circle`);
    const label = document.getElementById(`step${i}label`);
    if (i <= n) {
      if (circle) { circle.style.background = 'var(--gold)'; circle.style.color = 'white'; }
      if (label) { label.style.color = 'var(--gold)'; }
    }
  });
}

function showAlert(id, msg, type) {
  const el = document.getElementById(id);
  if (el) el.innerHTML = `<div class="alert alert-${type}"><i class="fas fa-${type === 'error' ? 'exclamation-circle' : 'check-circle'}"></i> ${msg}</div>`;
}

function getLocalInstructions(method, amount) {
  const fmt = Number(amount || 0).toLocaleString('fr-FR');
  const m = { orange_money: `*144# → Payer une facture → ${fmt} FCFA`, moov_money: `*555# → Paiement marchand → ${fmt} FCFA`, telecel_money: `*808# → Paiement → ${fmt} FCFA`, coris_money: `App Coris Money → Payer → ${fmt} FCFA` };
  return m[method] || '';
}

// ── INIT ──────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  loadRoomOptions();
  ['roomSelect', 'checkIn', 'checkOut', 'guestsSelect', 'breakfastCheck'].forEach(id => {
    document.getElementById(id)?.addEventListener('change', updatePriceSummary);
  });
  updatePriceSummary();
});
