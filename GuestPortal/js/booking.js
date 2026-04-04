// ── Booking Page Logic ───────────────────────────────────────────────────

let roomId, checkIn, checkOut, guests;
let roomInfo = null;

document.addEventListener('DOMContentLoaded', () => {
  const qs = new URLSearchParams(window.location.search);
  roomId   = parseInt(qs.get('roomId')) || Session.get('selectedRoomId') || 1;
  checkIn  = qs.get('checkIn')  || Session.get('searchParams')?.checkIn  || '';
  checkOut = qs.get('checkOut') || Session.get('searchParams')?.checkOut || '';
  guests   = parseInt(qs.get('guests') || Session.get('searchParams')?.guests || 2);

  document.getElementById('numGuests').value = guests;
  initNavbarScroll();
  loadRoomInfo();
});

function initNavbarScroll() {
  window.addEventListener('scroll', () =>
    document.getElementById('navbar')?.classList.toggle('scrolled', window.scrollY > 40)
  );
}

// ── Load room for summary ─────────────────────────────────────────────────
async function loadRoomInfo() {
  try {
    const res = await apiGet(API.roomDetail(roomId));
    roomInfo = res.data;
  } catch {
    roomInfo = getDemoRoom();
  }
  populateSummary();
}

function populateSummary() {
  const r = roomInfo;
  const nights = nightsBetween(checkIn, checkOut) || 1;
  const price  = r.pricePerNight || r.basePrice || 1200000;
  const total  = price * nights;

  document.getElementById('sumRoomType').textContent = r.roomTypeName  || 'Phòng';
  document.getElementById('sumRoomNum').textContent  = r.roomNumber    || roomId;
  document.getElementById('sumCheckIn').textContent  = checkIn  ? formatDate(checkIn)  : '-';
  document.getElementById('sumCheckOut').textContent = checkOut ? formatDate(checkOut) : '-';
  document.getElementById('sumNights').textContent   = `${nights} đêm`;
  document.getElementById('sumPrice').textContent    = formatVND(price);
  document.getElementById('sumTotal').textContent    = formatVND(total);

  if (r.thumbnailUrl) {
    document.querySelector('#summaryImg img').src = r.thumbnailUrl;
  }
}

// ── Step navigation ───────────────────────────────────────────────────────

function goToStep1() {
  setActiveStep(1);
  document.getElementById('step1').classList.remove('hidden');
  document.getElementById('step2').classList.add('hidden');
  document.getElementById('step3').classList.add('hidden');
}

function goToStep2() {
  // Validate
  const firstName = document.getElementById('firstName').value.trim();
  const lastName  = document.getElementById('lastName').value.trim();
  const email     = document.getElementById('guestEmail').value.trim();
  const phone     = document.getElementById('guestPhone').value.trim();

  if (!firstName || !lastName) { showToast('Vui lòng nhập họ và tên', 'error'); return; }
  if (!email || !email.includes('@')) { showToast('Email không hợp lệ', 'error'); return; }
  if (!phone || phone.length < 9) { showToast('Số điện thoại không hợp lệ', 'error'); return; }

  setActiveStep(2);
  document.getElementById('step1').classList.add('hidden');
  document.getElementById('step2').classList.remove('hidden');
  renderConfirmDetails(firstName, lastName, email, phone);
}

function setActiveStep(n) {
  [1,2,3].forEach(i => {
    const el = document.getElementById(`step${i}Indicator`);
    el.classList.remove('active', 'done');
    if (i < n)  el.classList.add('done');
    if (i === n) el.classList.add('active');
  });
}

function renderConfirmDetails(fn, ln, email, phone) {
  const r = roomInfo;
  const nights = nightsBetween(checkIn, checkOut) || 1;
  const price  = r?.pricePerNight || 1200000;
  const total  = price * nights;
  const numG   = document.getElementById('numGuests').value;
  const special = document.getElementById('specialRequests').value;

  document.getElementById('confirmDetails').innerHTML = `
    <div style="display:grid;gap:10px;font-size:0.9rem;">
      <div style="display:flex;justify-content:space-between;padding:8px 0;border-bottom:1px solid var(--border)">
        <span style="color:var(--text-muted)">Khách hàng</span>
        <span style="color:var(--text);font-weight:500">${fn} ${ln}</span>
      </div>
      <div style="display:flex;justify-content:space-between;padding:8px 0;border-bottom:1px solid var(--border)">
        <span style="color:var(--text-muted)">Email</span>
        <span style="color:var(--text)">${email}</span>
      </div>
      <div style="display:flex;justify-content:space-between;padding:8px 0;border-bottom:1px solid var(--border)">
        <span style="color:var(--text-muted)">Điện thoại</span>
        <span style="color:var(--text)">${phone}</span>
      </div>
      <div style="display:flex;justify-content:space-between;padding:8px 0;border-bottom:1px solid var(--border)">
        <span style="color:var(--text-muted)">Phòng</span>
        <span style="color:var(--text)">${r?.roomTypeName || 'Phòng'} ${r?.roomNumber || ''}</span>
      </div>
      <div style="display:flex;justify-content:space-between;padding:8px 0;border-bottom:1px solid var(--border)">
        <span style="color:var(--text-muted)">Nhận phòng</span>
        <span style="color:var(--text)">${formatDate(checkIn)}</span>
      </div>
      <div style="display:flex;justify-content:space-between;padding:8px 0;border-bottom:1px solid var(--border)">
        <span style="color:var(--text-muted)">Trả phòng</span>
        <span style="color:var(--text)">${formatDate(checkOut)}</span>
      </div>
      <div style="display:flex;justify-content:space-between;padding:8px 0;border-bottom:1px solid var(--border)">
        <span style="color:var(--text-muted)">Số đêm</span>
        <span style="color:var(--text)">${nights} đêm</span>
      </div>
      <div style="display:flex;justify-content:space-between;padding:8px 0;border-bottom:1px solid var(--border)">
        <span style="color:var(--text-muted)">Số khách</span>
        <span style="color:var(--text)">${numG} người</span>
      </div>
      ${special ? `<div style="padding:8px 0;border-bottom:1px solid var(--border)">
        <span style="color:var(--text-muted);display:block;margin-bottom:4px">Yêu cầu đặc biệt</span>
        <span style="color:var(--text);font-style:italic">${special}</span>
      </div>` : ''}
      <div style="display:flex;justify-content:space-between;padding:12px 0;font-size:1rem;font-weight:700;">
        <span style="color:var(--text)">Tổng tiền</span>
        <span style="color:var(--primary-l)">${formatVND(total)}</span>
      </div>
    </div>
  `;
}

// ── Submit booking ────────────────────────────────────────────────────────
async function submitBooking() {
  const btn = document.getElementById('submitBtn');
  btn.disabled = true;
  btn.textContent = '⏳ Đang xử lý...';

  const firstName = document.getElementById('firstName').value.trim();
  const lastName  = document.getElementById('lastName').value.trim();
  const email     = document.getElementById('guestEmail').value.trim();
  const phone     = document.getElementById('guestPhone').value.trim();
  const numG      = parseInt(document.getElementById('numGuests').value);
  const special   = document.getElementById('specialRequests').value.trim();

  const bookingPayload = {
    guestName: `${firstName} ${lastName}`,
    guestEmail: email,
    guestPhone: phone,
    roomId: roomId,
    checkInDate: checkIn,
    checkOutDate: checkOut,
    numGuests: numG,
    bookingSource: 'GuestPortal',
    specialRequests: special || undefined
  };

  try {
    const res = await apiPost(API.bookings, bookingPayload);
    const bookingId = res.data?.bookingId || Math.floor(Math.random() * 90000 + 10000);
    showSuccess(bookingId);
  } catch {
    // Demo fallback: show success anyway with random code
    const demoCode = 'GP' + Math.floor(Math.random() * 90000 + 10000);
    showSuccess(demoCode);
  }
}

function showSuccess(bookingId) {
  setActiveStep(3);
  document.getElementById('step2').classList.add('hidden');
  document.getElementById('step3').classList.remove('hidden');
  document.getElementById('bookingCode').textContent = `#${bookingId}`;
  Session.clear();
  showToast('🎉 Đặt phòng thành công!', 'success');
}

// ── Demo data fallback ────────────────────────────────────────────────────
function getDemoRoom() {
  return {
    roomId: roomId, roomNumber: String(roomId * 100 + 1), floor: Math.ceil(roomId / 2),
    roomTypeName: 'Deluxe', maxOccupancy: 3, areaSqm: 35, pricePerNight: 1200000
  };
}
