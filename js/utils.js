// ==========================================================================
// دوال مساعدة مشتركة تستخدمها كل الصفحات
// ==========================================================================

// ---------- Toast (رسائل تأكيد/خطأ) ----------
function toast(msg, type = 'success') {
  const box = document.getElementById('toast-box');
  const el = document.createElement('div');
  el.className = `toast toast-${type}`;
  el.textContent = msg;
  box.appendChild(el);
  requestAnimationFrame(() => el.classList.add('show'));
  setTimeout(() => {
    el.classList.remove('show');
    setTimeout(() => el.remove(), 300);
  }, 3000);
}

// ---------- نظام المودال ----------
function openModal(titleText, bodyHTML, footHTML) {
  document.getElementById('modal-head').textContent = titleText;
  document.getElementById('modal-box').innerHTML = bodyHTML;
  document.getElementById('modal-foot').innerHTML = footHTML;
  document.getElementById('modal-overlay').classList.add('open');
}

function closeModal() {
  document.getElementById('modal-overlay').classList.remove('open');
}

function confirmDelete(message, onConfirm) {
  openModal('تأكيد الحذف', `<p class="confirm-text">${message}</p>`, `
    <button class="btn btn-ghost" onclick="closeModal()">إلغاء</button>
    <button class="btn btn-danger" id="confirm-del-btn">حذف نهائي</button>
  `);
  document.getElementById('confirm-del-btn').onclick = async () => {
    await onConfirm();
    closeModal();
  };
}

// ---------- تواريخ ----------
function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

function addMonths(dateISO, months) {
  const d = new Date(dateISO);
  d.setMonth(d.getMonth() + Number(months));
  return d.toISOString().slice(0, 10);
}

function daysBetween(dateISO) {
  const diff = new Date(dateISO) - new Date(todayISO());
  return Math.round(diff / 86400000);
}

function fmtDate(dateISO) {
  if (!dateISO) return '—';
  const d = new Date(dateISO);
  return d.toLocaleDateString('ar-EG', { year: 'numeric', month: 'short', day: 'numeric' });
}

function fmtMoney(n) {
  return Number(n || 0).toLocaleString('ar-EG', { maximumFractionDigits: 2 }) + ' ر.س';
}

// ---------- عناصر فورم مشتركة ----------
function companyOptions(selected = '') {
  return COMPANIES.map(c => `<option value="${c}" ${c === selected ? 'selected' : ''}>${c}</option>`).join('');
}

function payerTypeOptions(selected = '') {
  return PAYER_TYPES.map(p => `<option value="${p.value}" ${p.value === selected ? 'selected' : ''}>${p.label}</option>`).join('');
}

function paymentTypeOptions(selected = '') {
  return PAYMENT_TYPES.map(p => `<option value="${p.value}" ${p.value === selected ? 'selected' : ''}>${p.label}</option>`).join('');
}

function frequencyOptions(selected = '') {
  return PAYMENT_FREQUENCIES.map(f => `<option value="${f.value}" ${Number(f.value) === Number(selected) ? 'selected' : ''}>${f.label}</option>`).join('');
}

function residenceOptions(residences, selected = '') {
  return residences.map(r => `<option value="${r.id}" ${r.id === selected ? 'selected' : ''}>${r.name}</option>`).join('');
}

function contractOptions(contracts, selected = '') {
  return contracts.map(c => `<option value="${c.id}" ${c.id === selected ? 'selected' : ''}>${c.contractNumber} — ${c.residenceName || ''}</option>`).join('');
}

// شارة حالة (مدفوع / قريب / متأخر) — تُستخدم في كذا صفحة
function statusBadge(status) {
  const map = {
    paid: { txt: 'مدفوعة', cls: 'badge-ok' },
    upcoming: { txt: 'قريبة', cls: 'badge-warn' },
    overdue: { txt: 'متأخرة', cls: 'badge-danger' },
    pending: { txt: 'قادمة', cls: 'badge-neutral' }
  };
  const s = map[status] || map.pending;
  return `<span class="badge ${s.cls}">${s.txt}</span>`;
}

// يحسب حالة الدفعة بناءً على تاريخ الاستحقاق وهل اتدفعت
function computePaymentStatus(payment) {
  if (payment.paidDate) return 'paid';
  const d = daysBetween(payment.dueDate);
  if (d < 0) return 'overdue';
  if (d <= ALERT_DAYS_BEFORE) return 'upcoming';
  return 'pending';
}

// مولّد id بسيط لو احتجنا معرف محلي قبل الحفظ
function localId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
}

// تفريغ نص من مسافات زيادة
function esc(str) {
  const div = document.createElement('div');
  div.textContent = str ?? '';
  return div.innerHTML;
}
