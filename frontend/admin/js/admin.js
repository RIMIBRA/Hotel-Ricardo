const API = 'https://hotel-ricardo.onrender.com/api';
// ── AUTH ──────────────────────────────────────────────────
function getToken() { return localStorage.getItem('admin_token'); }
function getUser() { try { return JSON.parse(localStorage.getItem('admin_user')); } catch { return null; } }

function checkAuth() {
  if (!getToken()) { window.location.href = 'login.html'; return false; }
  const user = getUser();
  if (user) {
    document.getElementById('userName')?.textContent.replace('...', user.name);
    document.querySelectorAll('.user-name').forEach(el => el.textContent = user.name);
    document.querySelectorAll('.user-avatar').forEach(el => el.textContent = user.name.charAt(0).toUpperCase());
  }
  return true;
}

function logout() {
  localStorage.removeItem('admin_token');
  localStorage.removeItem('admin_user');
  window.location.href = 'login.html';
}

// ── API HELPER ────────────────────────────────────────────
async function apiFetch(endpoint, options = {}) {
  const opts = {
    ...options,
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${getToken()}`, ...(options.headers || {}) }
  };
  const r = await fetch(`${API}${endpoint}`, opts);
  if (r.status === 401) { logout(); return; }
  return r;
}

// ── FORMAT HELPERS ─────────────────────────────────────────
function formatCFA(n) { return Number(n||0).toLocaleString('fr-FR') + ' FCFA'; }
function formatDate(d) { if (!d) return '–'; return new Date(d).toLocaleDateString('fr-FR', { day:'2-digit', month:'short', year:'numeric' }); }
function formatDateTime(d) { if (!d) return '–'; return new Date(d).toLocaleString('fr-FR', { day:'2-digit', month:'short', hour:'2-digit', minute:'2-digit' }); }

function badgeStatus(status) {
  const map = {
    en_attente: ['warning', 'En attente'], confirmee: ['success', 'Confirmée'],
    annulee: ['danger', 'Annulée'], refusee: ['danger', 'Refusée'],
    terminee: ['secondary', 'Terminée'], paye: ['success', 'Payé'],
    non_paye: ['warning', 'Non payé'], rembourse: ['info', 'Remboursé'],
    echoue: ['danger', 'Échoué']
  };
  const [cls, label] = map[status] || ['secondary', status];
  return `<span class="badge badge-${cls}">${label}</span>`;
}

function paymentMethodLabel(m) {
  const map = { orange_money:'🟠 Orange Money', moov_money:'🔵 Moov Money', telecel_money:'🔴 Telecel Money', coris_money:'💚 Coris Money', stripe:'💳 Carte bancaire', paypal:'🅿️ PayPal' };
  return map[m] || m;
}

// ── DEMO DATA (quand backend non disponible) ──────────────
const DEMO_STATS = {
  stats: { totalReservations:47, confirmedReservations:31, pendingReservations:8, totalRevenue:18540000, totalRooms:6, unreadMessages:3, todayCheckins:4, todayCheckouts:2 },
  revenueByMethod: [
    { method:'orange_money', total:6800000, count:18 }, { method:'moov_money', total:5200000, count:14 },
    { method:'telecel_money', total:3100000, count:8 }, { method:'stripe', total:2890000, count:5 }, { method:'paypal', total:550000, count:2 }
  ],
  last7days: [
    { date:'2026-05-14', reservations:5, revenue:1850000 }, { date:'2026-05-15', reservations:8, revenue:2960000 },
    { date:'2026-05-16', reservations:3, revenue:1110000 }, { date:'2026-05-17', reservations:7, revenue:2590000 },
    { date:'2026-05-18', reservations:6, revenue:2220000 }, { date:'2026-05-19', reservations:9, revenue:3330000 }, { date:'2026-05-20', reservations:4, revenue:1480000 }
  ],
  recentReservations: [
    { id:1, reference:'RIC-2605-1234', client_name:'Aminata Traoré', client_email:'aminata@email.com', room_name:'Chambre Double', check_in:'2026-05-22', check_out:'2026-05-24', total_price:74000, status:'confirmee', payment_status:'paye' },
    { id:2, reference:'RIC-2605-5678', client_name:'Jean-Pierre Ouédraogo', client_email:'jp@email.com', room_name:'Suite Junior', check_in:'2026-05-21', check_out:'2026-05-23', total_price:130000, status:'en_attente', payment_status:'non_paye' },
    { id:3, reference:'RIC-2605-9012', client_name:'Marie Dupont', client_email:'marie@email.com', room_name:'Suite Présidentielle', check_in:'2026-05-25', check_out:'2026-05-28', total_price:255000, status:'confirmee', payment_status:'paye' },
    { id:4, reference:'RIC-2605-3456', client_name:'Kofi Mensah', client_email:'kofi@email.com', room_name:'Chambre Simple', check_in:'2026-05-20', check_out:'2026-05-21', total_price:32000, status:'terminee', payment_status:'paye' },
    { id:5, reference:'RIC-2605-7890', client_name:'Fatou Diallo', client_email:'fatou@email.com', room_name:'Chambre Familiale', check_in:'2026-05-28', check_out:'2026-06-01', total_price:208000, status:'en_attente', payment_status:'non_paye' }
  ],
  roomOccupancy: [
    { name:'Chambre Double', type:'double', price:37000, total_reservations:15, nights_booked:30 },
    { name:'Suite Présidentielle', type:'suite_presidentielle', price:85000, total_reservations:8, nights_booked:16 },
    { name:'Chambre Simple', type:'simple', price:32000, total_reservations:12, nights_booked:18 },
    { name:'Chambre Familiale', type:'familiale', price:52000, total_reservations:6, nights_booked:24 },
    { name:'Suite Junior', type:'suite_junior', price:65000, total_reservations:4, nights_booked:8 },
    { name:'Chambre Twin', type:'twin', price:37000, total_reservations:2, nights_booked:4 }
  ]
};
