// ==========================================================================
// صفحة الكهرباء — عدادات + سجل فواتير/حركة لكل سكن
// ==========================================================================

async function renderElectricity(container) {
  const [meters, bills, residences] = await Promise.all([
    fetchAll(COL.electricityMeters),
    fetchAll(COL.electricityBills, 'date', true),
    fetchAll(COL.residences, 'name')
  ]);

  const resMap = Object.fromEntries(residences.map(r => [r.id, r.name]));
  meters.forEach(m => m.residenceName = resMap[m.residenceId] || '—');
  const meterMap = Object.fromEntries(meters.map(m => [m.id, m]));
  const payerLabel = Object.fromEntries(PAYER_TYPES.map(p => [p.value, p.label]));

  container.innerHTML = `
    <div class="page-head">
      <h2>الكهرباء</h2>
      <div class="head-actions">
        <button class="btn btn-ghost" id="add-meter-btn" ${residences.length === 0 ? 'disabled title="أضف سكن أولاً"' : ''}>+ عداد جديد</button>
        <button class="btn btn-primary" id="add-bill-btn" ${meters.length === 0 ? 'disabled title="أضف عداد أولاً"' : ''}>+ فاتورة جديدة</button>
      </div>
    </div>

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

  document.getElementById('add-meter-btn').onclick = () => openMeterForm(residences, null, COL.electricityMeters, 'electricity');
  document.getElementById('add-bill-btn').onclick = () => openBillForm(meters, COL.electricityBills, 'electricity');

  const grid = document.getElementById('meters-grid');
  grid.innerHTML = meters.length === 0
    ? `<div class="empty-state">لسه مفيش عدادات مضافة.</div>`
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
    b.onclick = () => openMeterForm(residences, meters.find(m => m.id === b.dataset.edit), COL.electricityMeters, 'electricity');
  });
  grid.querySelectorAll('[data-del]').forEach(b => {
    b.onclick = () => confirmDelete('هيتم حذف العداد. سجل الفواتير المرتبط به لن يُحذف تلقائيًا.', async () => {
      await deleteDoc(COL.electricityMeters, b.dataset.del);
      toast('تم حذف العداد');
      navigate('electricity');
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
      await deleteDoc(COL.electricityBills, b.dataset.delbill);
      toast('تم حذف الفاتورة');
      navigate('electricity');
    });
  });
}

// مشتركة بين الكهرباء والمياه
function openMeterForm(residences, meter, targetCol, pageKey) {
  const isEdit = !!meter;
  openModal(isEdit ? 'تعديل العداد' : 'عداد جديد', `
    <div class="form-group">
      <label>السكن *</label>
      <select id="f-residence">${residenceOptions(residences, meter?.residenceId)}</select>
    </div>
    <div class="form-group">
      <label>رقم العداد *</label>
      <input type="text" id="f-meter-number" value="${esc(meter?.meterNumber || '')}">
    </div>
    <div class="form-group">
      <label>مين المفروض يدفعها *</label>
      <select id="f-payer">${payerTypeOptions(meter?.payerType || 'company')}</select>
    </div>
  `, `
    <button class="btn btn-ghost" onclick="closeModal()">إلغاء</button>
    <button class="btn btn-primary" id="save-meter-btn">${isEdit ? 'حفظ التعديل' : 'إضافة'}</button>
  `);

  document.getElementById('save-meter-btn').onclick = async () => {
    const residenceId = document.getElementById('f-residence').value;
    const meterNumber = document.getElementById('f-meter-number').value.trim();
    if (!residenceId || !meterNumber) return toast('استكمل الحقول المطلوبة', 'error');

    const data = { residenceId, meterNumber, payerType: document.getElementById('f-payer').value };

    if (isEdit) {
      await updateDoc(targetCol, meter.id, data);
      toast('تم حفظ التعديل');
    } else {
      await addDoc(targetCol, data);
      toast('تمت إضافة العداد');
    }
    closeModal();
    navigate(pageKey);
  };
}

// مشتركة بين الكهرباء والمياه — نفرق بينهم بالـ collection اللي بتتبعت
function openBillForm(meters, targetCol, pageKey) {
  openModal('فاتورة جديدة', `
    <div class="form-group">
      <label>العداد *</label>
      <select id="f-meter">${meters.map(m => `<option value="${m.id}">${esc(m.residenceName)} — ${esc(m.meterNumber)}</option>`).join('')}</select>
    </div>
    <div class="form-row">
      <div class="form-group">
        <label>تاريخ الفاتورة *</label>
        <input type="date" id="f-date" value="${todayISO()}">
      </div>
      <div class="form-group">
        <label>المبلغ *</label>
        <input type="number" id="f-amount" min="0">
      </div>
    </div>
    <div class="form-group">
      <label>دُفعت من شركة *</label>
      <select id="f-company">${companyOptions()}</select>
    </div>
  `, `
    <button class="btn btn-ghost" onclick="closeModal()">إلغاء</button>
    <button class="btn btn-primary" id="save-bill-btn">إضافة</button>
  `);

  document.getElementById('save-bill-btn').onclick = async () => {
    const meterId = document.getElementById('f-meter').value;
    const date = document.getElementById('f-date').value;
    const amount = Number(document.getElementById('f-amount').value);
    const paidCompany = document.getElementById('f-company').value;
    if (!meterId || !date || !amount || !paidCompany) return toast('استكمل الحقول المطلوبة', 'error');

    await addDoc(targetCol, { meterId, date, amount, paidCompany });
    toast('تمت إضافة الفاتورة');
    closeModal();
    navigate(pageKey);
  };
}
