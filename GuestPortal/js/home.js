// ── Home Page Logic ─────────────────────────────────────────────────────

document.addEventListener('DOMContentLoaded', () => {
  initNavbarScroll();
  initParticles();
  initDateDefaults();
  initHeroSearch();
  loadFeaturedRooms();
  initScrollReveal();
});

// ── Navbar scroll effect ────────────────────────────────────────────────
function initNavbarScroll() {
  const nav = document.getElementById('navbar');
  window.addEventListener('scroll', () => {
    nav?.classList.toggle('scrolled', window.scrollY > 60);
  });
}

// ── Floating particles ──────────────────────────────────────────────────
function initParticles() {
  const container = document.getElementById('particles');
  if (!container) return;
  for (let i = 0; i < 30; i++) {
    const p = document.createElement('div');
    p.className = 'particle';
    p.style.cssText = `
      left: ${Math.random() * 100}%;
      animation-duration: ${8 + Math.random() * 12}s;
      animation-delay: ${Math.random() * 10}s;
      opacity: ${0.1 + Math.random() * 0.3};
      width: ${1 + Math.random() * 3}px;
      height: ${1 + Math.random() * 3}px;
    `;
    container.appendChild(p);
  }
}

// ── Set default check-in/out dates ─────────────────────────────────────
function initDateDefaults() {
  const today = new Date();
  const tomorrow = new Date(today);
  tomorrow.setDate(today.getDate() + 1);
  const dayAfter = new Date(today);
  dayAfter.setDate(today.getDate() + 2);

  const fmt = d => d.toISOString().split('T')[0];

  const ciEl = document.getElementById('checkIn');
  const coEl = document.getElementById('checkOut');
  if (ciEl) { ciEl.value = fmt(tomorrow); ciEl.min = fmt(today); }
  if (coEl) { coEl.value = fmt(dayAfter); coEl.min = fmt(tomorrow); }

  ciEl?.addEventListener('change', () => {
    if (coEl && coEl.value <= ciEl.value) {
      const d = new Date(ciEl.value);
      d.setDate(d.getDate() + 1);
      coEl.value = fmt(d);
    }
    coEl && (coEl.min = ciEl.value);
  });
}

// ── Hero search submit ──────────────────────────────────────────────────
function initHeroSearch() {
  const form = document.getElementById('heroSearchForm');
  form?.addEventListener('submit', (e) => {
    e.preventDefault();
    const checkIn  = document.getElementById('checkIn').value;
    const checkOut = document.getElementById('checkOut').value;
    const guests   = document.getElementById('guests').value;

    if (!checkIn || !checkOut) {
      showToast('Vui lòng chọn ngày check-in và check-out', 'error');
      return;
    }
    if (checkIn >= checkOut) {
      showToast('Ngày trả phòng phải sau ngày nhận phòng', 'error');
      return;
    }

    // Save to session & navigate
    Session.set('searchParams', { checkIn, checkOut, guests: parseInt(guests) });
    window.location.href = `search.html?checkIn=${checkIn}&checkOut=${checkOut}&guests=${guests}`;
  });
}

// ── Load featured rooms (3 available rooms) ─────────────────────────────
async function loadFeaturedRooms() {
  const container = document.getElementById('featuredRooms');
  if (!container) return;

  const today = new Date();
  const tomorrow = new Date(today);
  tomorrow.setDate(today.getDate() + 1);
  const fmt = d => d.toISOString().split('T')[0];

  try {
    const res = await apiGet(API.roomsAvailable, {
      checkIn: fmt(tomorrow),
      checkOut: fmt(new Date(tomorrow.getFullYear(), tomorrow.getMonth(), tomorrow.getDate() + 1))
    });
    const rooms = (res.data || []).slice(0, 3);
    if (rooms.length === 0) {
      container.innerHTML = renderFallbackRooms();
      return;
    }
    container.innerHTML = rooms.map(renderRoomCard).join('');
    attachRoomCardClicks();
  } catch {
    // Show fallback demo cards
    container.innerHTML = renderFallbackRooms();
    attachRoomCardClicks();
  }
}

function renderRoomCard(room) {
  const images = [
    'https://images.unsplash.com/photo-1631049307264-da0ec9d70304?w=600&q=80',
    'https://images.unsplash.com/photo-1571896349842-33c89424de2d?w=600&q=80',
    'https://images.unsplash.com/photo-1578683010236-d716f9a3f461?w=600&q=80',
  ];
  const img = images[room.roomId % images.length];
  return `
  <div class="room-card reveal" data-room-id="${room.roomId}" onclick="goToRoom(${room.roomId})">
    <div class="room-img-wrap">
      <img src="${img}" alt="${room.roomTypeName}" loading="lazy"
           onerror="this.src='https://via.placeholder.com/400x250/1a2030/7c3aed?text=Luxstay+Room'" />
      <span class="room-type-badge">${room.roomTypeName}</span>
      <span class="room-price-badge">${formatVND(room.pricePerNight)}/đêm</span>
    </div>
    <div class="room-body">
      <div class="room-name">${room.roomTypeName} — Phòng ${room.roomNumber}</div>
      <div class="room-meta">
        <span class="meta-item">🏢 Tầng ${room.floor}</span>
        <span class="meta-item">👥 Tối đa ${room.maxOccupancy} khách</span>
        ${room.areaSqm ? `<span class="meta-item">📐 ${room.areaSqm}m²</span>` : ''}
      </div>
      <div class="room-price">
        <span class="amount">${formatVND(room.pricePerNight)}</span>
        <span class="per-night">/đêm</span>
      </div>
    </div>
  </div>`;
}

function renderFallbackRooms() {
  const demo = [
    { id: 1, name: 'Standard',  floor: 1, guests: 2, area: 25, price: 850000,  img: 'https://images.unsplash.com/photo-1631049307264-da0ec9d70304?w=600&q=80' },
    { id: 2, name: 'Deluxe',    floor: 3, guests: 3, area: 35, price: 1200000, img: 'https://images.unsplash.com/photo-1571896349842-33c89424de2d?w=600&q=80' },
    { id: 3, name: 'Suite',     floor: 5, guests: 4, area: 55, price: 2500000, img: 'https://images.unsplash.com/photo-1578683010236-d716f9a3f461?w=600&q=80' },
  ];
  return demo.map(r => `
  <div class="room-card reveal" onclick="window.location.href='search.html'">
    <div class="room-img-wrap">
      <img src="${r.img}" alt="${r.name}" loading="lazy" />
      <span class="room-type-badge">${r.name}</span>
      <span class="room-price-badge">${formatVND(r.price)}/đêm</span>
    </div>
    <div class="room-body">
      <div class="room-name">${r.name} Room</div>
      <div class="room-meta">
        <span class="meta-item">🏢 Tầng ${r.floor}</span>
        <span class="meta-item">👥 Tối đa ${r.guests} khách</span>
        <span class="meta-item">📐 ${r.area}m²</span>
      </div>
      <div class="room-price">
        <span class="amount">${formatVND(r.price)}</span>
        <span class="per-night">/đêm</span>
      </div>
    </div>
  </div>
  `).join('');
}

function goToRoom(roomId) {
  const params = Session.get('searchParams') || {};
  const qs = new URLSearchParams({ id: roomId, ...params }).toString();
  window.location.href = `room.html?${qs}`;
}

function attachRoomCardClicks() {
  document.querySelectorAll('[data-room-id]').forEach(el => {
    el.style.cursor = 'pointer';
  });
}

// ── Scroll reveal ───────────────────────────────────────────────────────
function initScrollReveal() {
  const io = new IntersectionObserver((entries) => {
    entries.forEach(e => e.isIntersecting && e.target.classList.add('visible'));
  }, { threshold: 0.12 });
  document.querySelectorAll('.reveal').forEach(el => io.observe(el));
}
