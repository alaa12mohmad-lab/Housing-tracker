// ==========================================================================
// صفحة المياه — نفس فكرة الكهرباء بالظبط، لكن اختيارية (مش كل سكن له عداد مياه)
// ==========================================================================

async function renderWater(container) {
  const [meters, bills, residences] = await Promise.all([
    fetchAll(COL.waterMeters),
    fetchAll(COL.waterBills, 'date', true),
    fetchAll(COL.residences, 'name')
  ]);

  const resMap = Object.fromEntries(residences.map(r => [r.id, r.name]));
  meters.forEach(m => m.residenceName = resMap[m.residenceId] || '—');
  const meterMap = Object.fromEntries(meters.map(m => [m.id, m]));
  const payerLabel = Object.fromEntries(PAYER_TYPES.map(p => [p.value, p.label]));

  container.innerHTML = `
    <div class="page-head">
      <h2>المياه</h2>
      <div class="head-actions">
        <button class="btn btn-ghost" id="add-meter-btn" ${residences.length === 0 ? 'disabled title="أضف سكن أولاً"' : ''}>+ عداد جديد</button>
        <button class="btn btn-primary" id="add-bill-btn" ${meters.length === 0 ? 'disabled title="أضف عداد أولاً"' : ''}>+ فاتورة جديدة</button>
      </div>
    </div>
    <p class="muted small">لو السكن مالوش عداد مياه مستقل (مثلاً ضمن الإيجار)، مش لازم تضيفه هنا.</p>

    <h3 class="section-sub">العدادات</h3>
    <div class="card-grid" id="meters-grid"></div>

    <h3 class="section-sub">سجل حركة الفواتير</h3>
    <div class="table-wrap">
      <table class="data-table" id="bills-table">
        <thead><tr><th>السكن</th><th>رقم العداد</th><th>التاريخ</th><th>المبلغ</th><th>دُفعت من</th><th></th></tr></thead>
        <tbody></tbody>
      </table>
    </div>
  `;

  document.getElementById('add-meter-btn').onclick = () => openMeterForm(residences, null, COL.waterMeters, 'water');
  document.getElementById('add-bill-btn').onclick = () => openBillForm(meters, COL.waterBills, 'water');

  const grid = document.getElementById('meters-grid');
  grid.innerHTML = meters.length === 0
    ? `<div class="empty-state">لسه مفيش عدادات مياه مضافة.</div>`
    : meters.map(m => `
      <div class="card">
        <div class="card-top">
          <h3>${esc(m.residenceName)}</h3>
          <div class="card-menu">
            <button class="icon-btn" data-edit="${m.id}">✎</button>
            <button class="icon-btn" data-del="${m.id}">🗑</button>
          </div>
        </div>
        <p class="muted">رقم العداد: ${esc(m.meterNumber)}</p>
        <p class="notes-line">تدفعها: ${payerLabel[m.payerType] || '—'}</p>
      </div>
    `).join('');

  grid.querySelectorAll('[data-edit]').forEach(b => {
    b.onclick = () => openMeterForm(residences, meters.find(m => m.id === b.dataset.edit), COL.waterMeters, 'water');
  });
  grid.querySelectorAll('[data-del]').forEach(b => {
    b.onclick = () => confirmDelete('هيتم حذف العداد. سجل الفواتير المرتبط به لن يُحذف تلقائيًا.', async () => {
      await deleteDoc(COL.waterMeters, b.dataset.del);
      toast('تم حذف العداد');
      navigate('water');
    });
  });

  const tbody = document.querySelector('#bills-table tbody');
  tbody.innerHTML = bills.length === 0
    ? `<tr><td colspan="6" class="empty-state">لسه مفيش فواتير مسجلة.</td></tr>`
    : bills.map(b => {
      const m = meterMap[b.meterId] || {};
      return `
        <tr>
          <td>${esc(m.residenceName || '—')}</td>
          <td>${esc(m.meterNumber || '—')}</td>
          <td>${fmtDate(b.date)}</td>
          <td>${fmtMoney(b.amount)}</td>
          <td>${esc(b.paidCompany || '—')}</td>
          <td class="row-actions"><button class="icon-btn" data-delbill="${b.id}">🗑</button></td>
        </tr>
      `;
    }).join('');

  tbody.querySelectorAll('[data-delbill]').forEach(b => {
    b.onclick = () => confirmDelete('هيتم حذف الفاتورة من السجل.', async () => {
      await deleteDoc(COL.waterBills, b.dataset.delbill);
      toast('تم حذف الفاتورة');
      navigate('water');
    });
  });
}
