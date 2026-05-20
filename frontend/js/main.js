// ── NAVBAR SCROLL ──────────────────────────────────────────
const navbar = document.getElementById('navbar');
if (navbar && navbar.classList.contains('transparent')) {
  window.addEventListener('scroll', () => {
    navbar.classList.toggle('scrolled', window.scrollY > 60);
    navbar.classList.toggle('transparent', window.scrollY <= 60);
  });
}

// ── MOBILE MENU ──────────────────────────────────────────
const navToggle = document.getElementById('navToggle');
const navMenu = document.getElementById('navMenu');
if (navToggle && navMenu) {
  navToggle.addEventListener('click', () => {
    navMenu.classList.toggle('open');
    navToggle.classList.toggle('open');
  });
  navMenu.querySelectorAll('a').forEach(a => a.addEventListener('click', () => navMenu.classList.remove('open')));
}

// ── AOS (ANIMATE ON SCROLL) ──────────────────────────────
function initAOS() {
  const elements = document.querySelectorAll('[data-aos]');
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(e => { if (e.isIntersecting) { e.target.classList.add('visible'); observer.unobserve(e.target); } });
  }, { threshold: 0.1, rootMargin: '0px 0px -50px 0px' });
  elements.forEach(el => observer.observe(el));
}
document.addEventListener('DOMContentLoaded', initAOS);

// ── DATES MIN ──────────────────────────────────────────
const today = new Date().toISOString().split('T')[0];
document.querySelectorAll('input[type="date"]').forEach(input => {
  if (!input.min) input.min = today;
});

const ciEl = document.getElementById('checkIn');
const coEl = document.getElementById('checkOut');
if (ciEl && coEl) {
  ciEl.min = today;
  ciEl.value = today;
  const tomorrow = new Date(); tomorrow.setDate(tomorrow.getDate() + 1);
  coEl.min = tomorrow.toISOString().split('T')[0];
  coEl.value = tomorrow.toISOString().split('T')[0];
  ciEl.addEventListener('change', () => {
    const d = new Date(ciEl.value); d.setDate(d.getDate() + 1);
    coEl.min = d.toISOString().split('T')[0];
    if (coEl.value <= ciEl.value) coEl.value = d.toISOString().split('T')[0];
  });
}

// ── FORMAT CURRENCY ──────────────────────────────────────
function formatCFA(amount) {
  return Number(amount).toLocaleString('fr-FR') + ' FCFA';
}

// ── FORMAT DATE FR ────────────────────────────────────────
function formatDateFR(dateStr) {
  if (!dateStr) return '–';
  const d = new Date(dateStr);
  return d.toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' });
}
