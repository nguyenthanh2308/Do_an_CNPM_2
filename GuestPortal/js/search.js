// ── Search Page Logic ────────────────────────────────────────────────────

let allRooms = [];
let checkIn, checkOut, guests;

document.addEventListener('DOMContentLoaded', () => {
  initNavbarScroll();
  parseUrlParams();
  initSearchForm();
  initSort();
  searchRooms();
});

function initNavbarScroll() {
  const nav = document.getElementById('navbar');
  window.addEventListener('scroll', () => nav?.classList.toggle('scrolled', window.scrollY > 60));
}

// ── Parse URL or session params ──────────────────────────────────────────
function parseUrlParams() {
  const qs = new URLSearchParams(window.location.search);
  const saved = Session.get('searchParams') || {};

  // Set default dates
  const today = new Date();
  const tomorrow = new Date(today); tomorrow.setDate(today.getDate() + 1);
  const dayAfter = new Date(today); dayAfter.setDate(today.getDate() + 2);
  const fmt = d => d.toISOString().split('T')[0];

  checkIn  = qs.get('checkIn')  || saved.checkIn  || fmt(tomorrow);
  checkOut = qs.get('checkOut') || saved.checkOut || fmt(dayAfter);
  guests   = parseInt(qs.get('guests') || saved.guests || 2);

  // Populate form
  document.getElementById('checkIn').value  = checkIn;
  document.getElementById('checkOut').value = checkOut;
  document.getElementById('guests').value   = guests;

  // Set min dates
  document.getElementById('checkIn').min  = fmt(today);
  document.getElementById('checkOut').min = checkIn;
}

// ── Search Form ──────────────────────────────────────────────────────────
function initSearchForm() {
  const form = document.getElementById('searchForm');
  form?.addEventListener('submit', e => {
    e.preventDefault();
    checkIn  = document.getElementById('checkIn').value;
    checkOut = document.getElementById('checkOut').value;
    guests   = parseInt(document.getElementById('guests').value);

    if (!checkIn || !checkOut) { showToast('Chọn ngày đầy đủ', 'error'); return; }
    if (checkIn >= checkOut)   { showToast('Ngày trả phòng phải sau ngày nhận', 'error'); return; }

    Session.set('searchParams', { checkIn, checkOut, guests });
    const url = new URL(window.location.href);
    url.searchParams.set('checkIn', checkIn);
    url.searchParams.set('checkOut', checkOut);
    url.searchParams.set('guests', guests);
    window.history.replaceState({}, '', url);
    searchRooms();
  });
}

// ── Sort ─────────────────────────────────────────────────────────────────
function initSort() {
  document.getElementById('sortSelect')?.addEventListener('change', renderRooms);
}

// ── API Call ─────────────────────────────────────────────────────────────
async function searchRooms() {
  showSkeleton();
  updateResultTitle();

  try {
    const res = await apiGet(API.roomsAvailable, { checkIn, checkOut, guests });
    allRooms = res.data || [];
    renderRooms();
  } catch {
    // Demo fallback
    allRooms = getDemoRooms();
    renderRooms();
    showToast('Đang hiển thị dữ liệu mẫu (Backend chưa kết nối)', 'info');
  }
}

function updateResultTitle() {
  const nights = nightsBetween(checkIn, checkOut) || 1;
  document.getElementById('resultTitle').textContent = `Tìm phòng từ ${formatDate(checkIn)} → ${formatDate(checkOut)}`;
  document.getElementById('resultSub').textContent   = `${nights} đêm • ${guests} khách`;
}

// ── Render ────────────────────────────────────────────────────────────────
function renderRooms() {
  const grid   = document.getElementById('roomsGrid');
  const empty  = document.getElementById('emptyState');
  const sort   = document.getElementById('sortSelect')?.value || 'price_asc';
  const nights = nightsBetween(checkIn, checkOut) || 1;

  let rooms = [...allRooms];

  // Sort
  const sorters = {
    price_asc:   (a,b) => a.pricePerNight - b.pricePerNight,
    price_desc:  (a,b) => b.pricePerNight - a.pricePerNight,
    floor_asc:   (a,b) => a.floor - b.floor,
    floor_desc:  (a,b) => b.floor - a.floor,
  };
  rooms.sort(sorters[sort] || sorters.price_asc);

  if (rooms.length === 0) {
    grid.innerHTML = '';
    empty.classList.remove('hidden');
    return;
  }

  empty.classList.add('hidden');
  grid.innerHTML = rooms.map((r, i) => renderCard(r, nights, i)).join('');
  // Stagger animation
  grid.querySelectorAll('.room-card').forEach((el, i) => {
    el.style.animationDelay = `${i * 0.06}s`;
    el.classList.add('fade-in');
  });

  document.getElementById('resultTitle').textContent =
    `${rooms.length} phòng trống · ${formatDate(checkIn)} → ${formatDate(checkOut)}`;
}

function renderCard(room, nights, idx) {
  const photos = [
    'https://images.unsplash.com/photo-1631049307264-da0ec9d70304?w=600&q=80',
    'https://images.unsplash.com/photo-1571896349842-33c89424de2d?w=600&q=80',
    'https://images.unsplash.com/photo-1578683010236-d716f9a3f461?w=600&q=80',
    'https://images.unsplash.com/photo-1560185127-6ed189bf02f4?w=600&q=80',
  ];
  const img = room.thumbnailUrl || photos[idx % photos.length];
  const total = room.pricePerNight * nights;

  return `
  <div class="room-card" onclick="goToRoom(${room.roomId || room.id})">
    <div class="room-img-wrap">
      <img src="${img}" alt="${room.roomTypeName}"
           onerror="this.src='https://via.placeholder.com/400x250/1a2030/7c3aed?text=LuxStay'" />
      <span class="room-type-badge">${room.roomTypeName}</span>
      <span class="room-price-badge">${formatVND(room.pricePerNight)}/đêm</span>
    </div>
    <div class="room-body">
      <div class="room-name">${room.roomTypeName}${room.roomNumber ? ' — Phòng ' + room.roomNumber : ''}</div>
      <div class="room-meta">
        <span class="meta-item">🏢 Tầng ${room.floor}</span>
        <span class="meta-item">👥 ${room.maxOccupancy} khách</span>
        ${room.areaSqm ? `<span class="meta-item">📐 ${room.areaSqm}m²</span>` : ''}
      </div>
      <div style="display:flex;justify-content:space-between;align-items:center;margin-top:12px;">
        <div class="room-price">
          <span class="amount">${formatVND(room.pricePerNight)}</span>
          <span class="per-night">/đêm</span>
        </div>
        <span style="font-size:0.78rem;color:var(--text-dim);">Tổng ${formatVND(total)}</span>
      </div>
      <button class="btn btn-primary btn-block" style="margin-top:14px;padding:10px;"
              onclick="event.stopPropagation();bookRoom(${room.roomId || room.id})">
        Đặt ngay →
      </button>
    </div>
  </div>`;
}

function showSkeleton() {
  document.getElementById('roomsGrid').innerHTML = [1,2,3,4,5,6].map(() =>
    `<div class="card" style="height:320px"><div class="skeleton" style="height:100%"></div></div>`
  ).join('');
  document.getElementById('emptyState').classList.add('hidden');
}

function goToRoom(id) {
  Session.set('searchParams', { checkIn, checkOut, guests });
  window.location.href = `room.html?id=${id}&checkIn=${checkIn}&checkOut=${checkOut}&guests=${guests}`;
}

function bookRoom(id) {
  Session.set('searchParams', { checkIn, checkOut, guests });
  Session.set('selectedRoomId', id);
  window.location.href = `booking.html?roomId=${id}&checkIn=${checkIn}&checkOut=${checkOut}&guests=${guests}`;
}

// ── Demo data ─────────────────────────────────────────────────────────────
function getDemoRooms() {
  return [
    { roomId:1, roomNumber:'101', floor:1, roomTypeName:'Standard',  maxOccupancy:2, areaSqm:25, pricePerNight:850000  },
    { roomId:2, roomNumber:'203', floor:2, roomTypeName:'Standard',  maxOccupancy:2, areaSqm:28, pricePerNight:900000  },
    { roomId:3, roomNumber:'305', floor:3, roomTypeName:'Deluxe',    maxOccupancy:3, areaSqm:35, pricePerNight:1200000 },
    { roomId:4, roomNumber:'401', floor:4, roomTypeName:'Deluxe',    maxOccupancy:3, areaSqm:38, pricePerNight:1350000 },
    { roomId:5, roomNumber:'502', floor:5, roomTypeName:'Suite',     maxOccupancy:4, areaSqm:55, pricePerNight:2500000 },
    { roomId:6, roomNumber:'601', floor:6, roomTypeName:'Penthouse', maxOccupancy:4, areaSqm:80, pricePerNight:4500000 },
  ];
}
