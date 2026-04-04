// ── Room Detail Page ─────────────────────────────────────────────────────

let roomData = null;
let checkIn, checkOut, guests;

document.addEventListener('DOMContentLoaded', () => {
  const qs = new URLSearchParams(window.location.search);
  const roomId  = qs.get('id');
  checkIn  = qs.get('checkIn')  || Session.get('searchParams')?.checkIn;
  checkOut = qs.get('checkOut') || Session.get('searchParams')?.checkOut;
  guests   = parseInt(qs.get('guests') || Session.get('searchParams')?.guests || 2);

  if (!roomId) { window.location.href = 'search.html'; return; }

  loadRoom(roomId);
  initNavbarScroll();
});

function initNavbarScroll() {
  const nav = document.getElementById('navbar');
  window.addEventListener('scroll', () => nav?.classList.toggle('scrolled', window.scrollY > 60));
}

// ── Load room data ────────────────────────────────────────────────────────
async function loadRoom(id) {
  try {
    const res = await apiGet(API.roomDetail(id));
    roomData = res.data;
    renderRoom(roomData);
  } catch {
    // Fallback demo
    roomData = getDemoRoom(parseInt(id));
    renderRoom(roomData);
    showToast('Đang hiển thị dữ liệu mẫu', 'info');
  }
}

function renderRoom(room) {
  document.getElementById('loadingState').classList.add('hidden');
  document.getElementById('roomDetail').classList.remove('hidden');

  const photos = [
    'https://images.unsplash.com/photo-1631049307264-da0ec9d70304?w=900&q=90',
    'https://images.unsplash.com/photo-1571896349842-33c89424de2d?w=900&q=90',
    'https://images.unsplash.com/photo-1578683010236-d716f9a3f461?w=900&q=90',
    'https://images.unsplash.com/photo-1560185127-6ed189bf02f4?w=900&q=90',
  ];

  // Main image
  document.getElementById('mainImg').src = room.thumbnailUrl || photos[0];
  document.getElementById('mainImg').alt = room.roomTypeName;

  // Thumbnails
  const thumbs = document.getElementById('thumbRow');
  thumbs.innerHTML = photos.map((ph, i) => `
    <div style="border-radius:8px;overflow:hidden;aspect-ratio:4/3;cursor:pointer;border:2px solid ${i===0?'var(--primary)':'transparent'}"
         onclick="switchImg('${ph}', this)">
      <img src="${ph}" style="width:100%;height:100%;object-fit:cover;" />
    </div>
  `).join('');

  // Name & breadcrumb
  const name = `${room.roomTypeName || 'Phòng'}${room.roomNumber ? ' — Phòng ' + room.roomNumber : ''}`;
  document.getElementById('roomName').textContent = name;
  document.getElementById('breadcrumbRoom').textContent = name;
  document.title = `${name} — LuxStay`;

  // Meta row
  const metas = [
    { icon: '🏢', text: `Tầng ${room.floor || 1}` },
    { icon: '👥', text: `Tối đa ${room.maxOccupancy || 2} khách` },
    ...(room.areaSqm ? [{ icon: '📐', text: `${room.areaSqm}m²` }] : []),
    { icon: '🛏️', text: room.roomTypeName },
  ];
  document.getElementById('roomMetaRow').innerHTML = metas.map(m =>
    `<div class="amenity-chip">${m.icon} ${m.text}</div>`
  ).join('');

  // Amenities
  const amenities = room.amenities?.length ? room.amenities : getDefaultAmenities();
  document.getElementById('amenitiesRow').innerHTML = amenities.map(a =>
    `<div class="amenity-chip">${a.icon || '✓'} ${a.name}</div>`
  ).join('');

  // Description
  document.getElementById('roomDesc').textContent =
    room.description ||
    `Phòng ${room.roomTypeName} được thiết kế sang trọng, trang bị đầy đủ tiện nghi hiện đại. ` +
    `Phòng rộng rãi, thoáng mát với tầm nhìn đẹp. Giường lớn nệm cao cấp, phòng tắm riêng với bồn tắm ` +
    `và vòi sen, điều hòa không khí inverter, TV màn hình phẳng 55 inch và minibar.`;

  // Pricing
  const price = room.pricePerNight || room.basePrice || 1200000;
  const nights = checkIn && checkOut ? nightsBetween(checkIn, checkOut) : 1;
  const total = price * nights;

  document.getElementById('priceMain').textContent = formatVND(price);
  document.getElementById('priceRow').textContent  = formatVND(price);
  document.getElementById('nightsRow').textContent = `${nights} đêm`;
  document.getElementById('totalRow').textContent  = formatVND(total);

  if (checkIn)  document.getElementById('ciDisplay').textContent = formatDate(checkIn);
  if (checkOut) document.getElementById('coDisplay').textContent = formatDate(checkOut);
}

function switchImg(src, el) {
  document.getElementById('mainImg').src = src;
  document.querySelectorAll('#thumbRow > div').forEach(d => d.style.borderColor = 'transparent');
  el.style.borderColor = 'var(--primary)';
}

function proceedToBook() {
  if (!roomData) return;
  const qs = new URLSearchParams({
    roomId:   roomData.roomId || roomData.id || 1,
    checkIn:  checkIn  || '',
    checkOut: checkOut || '',
    guests:   guests   || 2
  });
  window.location.href = `booking.html?${qs}`;
}

// ── Helpers ───────────────────────────────────────────────────────────────
function getDefaultAmenities() {
  return [
    { name: 'WiFi miễn phí',   icon: '📶' },
    { name: 'Điều hòa',        icon: '❄️' },
    { name: 'TV màn hình phẳng',icon: '📺' },
    { name: 'Minibar',         icon: '🍾' },
    { name: 'Phòng tắm riêng', icon: '🚿' },
    { name: 'Két sắt',         icon: '🔒' },
    { name: 'Máy sấy tóc',     icon: '💨' },
    { name: 'Dép phòng',       icon: '👟' },
  ];
}

function getDemoRoom(id) {
  const types  = ['Standard', 'Deluxe', 'Suite', 'Penthouse'];
  const prices = [850000, 1200000, 2500000, 4500000];
  const areas  = [25, 35, 55, 80];
  const i = (id - 1) % 4;
  return {
    roomId: id, roomNumber: String(id * 100 + 1), floor: id,
    roomTypeName: types[i], maxOccupancy: [2,3,4,4][i], areaSqm: areas[i],
    pricePerNight: prices[i], amenities: getDefaultAmenities()
  };
}
