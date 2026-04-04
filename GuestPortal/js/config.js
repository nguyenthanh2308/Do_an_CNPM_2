// ══════════════════════════════════════════════════════
// Guest Portal — API Configuration
// ══════════════════════════════════════════════════════
const API_BASE = 'http://localhost:5000/api';

const API = {
  roomsAvailable: `${API_BASE}/rooms/available`,
  roomDetail: (id) => `${API_BASE}/rooms/${id}`,
  bookings: `${API_BASE}/bookings`,
  guests: `${API_BASE}/guests`,
  ratePlans: `${API_BASE}/rate-plans`,
  roomTypes: `${API_BASE}/room-types`,
};

// ── HTTP helpers ────────────────────────────────────────
async function apiGet(url, params = {}) {
  const qs = new URLSearchParams(params).toString();
  const full = qs ? `${url}?${qs}` : url;
  const res = await fetch(full, {
    headers: { 'Accept': 'application/json' }
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}

async function apiPost(url, body = {}) {
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
    body: JSON.stringify(body)
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err?.message || `HTTP ${res.status}`);
  }
  return res.json();
}

// ── Session Storage for booking flow ───────────────────
const Session = {
  set: (key, val) => sessionStorage.setItem(key, JSON.stringify(val)),
  get: (key) => { try { return JSON.parse(sessionStorage.getItem(key)); } catch { return null; } },
  clear: () => sessionStorage.clear()
};

// ── Format helpers ──────────────────────────────────────
function formatVND(amount) {
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
}

function formatDate(dateStr) {
  return new Date(dateStr).toLocaleDateString('vi-VN', { weekday: 'short', day: '2-digit', month: '2-digit', year: 'numeric' });
}

function nightsBetween(start, end) {
  const ms = new Date(end) - new Date(start);
  return Math.round(ms / 86400000);
}

function showToast(msg, type = 'success') {
  const el = document.getElementById('toast');
  if (!el) return;
  el.textContent = msg;
  el.className = `toast toast-${type} show`;
  setTimeout(() => el.classList.remove('show'), 3500);
}
