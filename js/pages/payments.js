// ==========================================================================
// صفحة الدفعات
// ==========================================================================

async function renderPayments(container) {
  const [payments, contracts, residences] = await Promise.all([
    fetchAll(COL.payments, 'dueDate'),
    fetchAll(COL.contracts, 'startDate'),
    fetchAll(COL.residences, 'name')
  ]);

  const resMap = Object.fromEntries(residences.map(r => [r.id, r.name]));
  contracts.forEach(c => c.residenceName = resMap[c.residenceId] || '—');
  const contractMap = Object.fromEntries(contracts.map(c => [c.id, c]));

  container.innerHTML = `
    <div class="page-head">
      <h2>الدفعات</h2>
      <button class="btn btn-primary" id="add-payment-btn" ${contracts.length === 0 ? 'disabled title="أضف عقد أولاً"' : ''}>+ دفعة جديدة</button>
    </div>
    <p class="muted small">الدفعات الدورية بتتولد تلقائي من صفحة "العقود" عند إضافة أو تحديث عقد. استخدم الزرار ده بس لدفعات إضافية (زي دفعة مقدمة/تأمين) أو تعديلات يدوية.</p>

    <div class="filter-bar">
      <div class="form-group">
        <label>فلترة حسب السكن</label>
        <select id="filter-residence">
          <option value="">كل المساكن</option>
          ${residences.map(r => `<option value="${r.id}">${esc(r.name)}</option>`).join('')}
        </select>
      </div>
      <div class="form-group">
        <label>فلترة حسب الحالة</label>
        <select id="filter-status">
          <option value="">كل الحالات</option>
          <option value="overdue">متأخرة</option>
          <option value="upcoming">قريبة</option>
          <option value="pending">قادمة</option>
          <option value="paid">مدفوعة</option>
        </select>
      </div>
      <span class="filter-count" id="filter-count"></span>
    </div>

    <div class="table-wrap">
      <table class="data-table" id="payments-table">
        <thead>
          <tr>
            <th>السكن</th><th>رقم العقد</th><th>النوع</th><th>الفترة</th><th>المبلغ</th>
            <th>الحالة</th><th>دُفعت من</th><th></th>
          </tr>
        </thead>
        <tbody></tbody>
      </table>
    </div>
  `;

  if (contracts.length === 0) {
    container.querySelector('.table-wrap').innerHTML = `<div class="empty-state">لازم تضيف عقد الأول من صفحة "العقود".</div>`;
    return;
  }

  document.getElementById('add-payment-btn').onclick = () => openPaymentForm(contracts);

  const tbody = document.querySelector('#payments-table tbody');
  const countEl = document.getElementById('filter-count');

  function renderRows() {
    const residenceFilter = document.getElementById('filter-residence').value;
    const statusFilter = document.getElementById('filter-status').value;

    const filtered = payments.filter(p => {
      const c = contractMap[p.contractId] || {};
      if (residenceFilter && c.residenceId !== residenceFilter) return false;
      if (statusFilter && computePaymentStatus(p) !== statusFilter) return false;
      return true;
    });

    countEl.textContent = `${filtered.length} من ${payments.length} دفعة`;

    if (filtered.length === 0) {
      tbody.innerHTML = `<tr><td colspan="8" class="empty-state">مفيش دفعات مطابقة للفلتر.</td></tr>`;
    } else {
      tbody.innerHTML = filtered.map(p => {
        const c = contractMap[p.contractId] || {};
        const status = computePaymentStatus(p);
        const periodTxt = p.type === 'advance' ? `دفعة مقدمة — استحقاق ${fmtDate(p.dueDate)}` : `${fmtDate(p.periodStart)} → ${fmtDate(p.periodEnd)}`;
        return `
          <tr>
            <td>${esc(c.residenceName || '—')}</td>
            <td>${esc(c.contractNumber || '—')}</td>
            <td>${p.type === 'advance' ? 'مقدمة' : 'عن فترة'}</td>
            <td>${periodTxt}</td>
            <td>${fmtMoney(p.amount)}</td>
            <td>${statusBadge(status)}</td>
            <td>${esc(p.paidCompany || '—')}</td>
            <td class="row-actions">
              ${!p.paidDate ? `<button class="btn btn-sm btn-ok" data-pay="${p.id}">تم الدفع</button>` : ''}
              <button class="icon-btn" data-edit="${p.id}">✎</button>
              <button class="icon-btn" data-del="${p.id}">🗑</button>
            </td>
          </tr>
        `;
      }).join('');
    }

    tbody.querySelectorAll('[data-edit]').forEach(b => {
      b.onclick = () => openPaymentForm(contracts, payments.find(p => p.id === b.dataset.edit));
    });
    tbody.querySelectorAll('[data-del]').forEach(b => {
      b.onclick = () => {
        confirmDelete('هيتم حذف الدفعة نهائيًا.', async () => {
          await deleteDoc(COL.payments, b.dataset.del);
          toast('تم حذف الدفعة');
          navigate('payments');
        });
      };
    });
    tbody.querySelectorAll('[data-pay]').forEach(b => {
      b.onclick = () => openMarkPaidForm(payments.find(p => p.id === b.dataset.pay));
    });
  }

  document.getElementById('filter-residence').onchange = renderRows;
  document.getElementById('filter-status').onchange = renderRows;

  renderRows();
}

function openPaymentForm(contracts, payment = null) {
  const isEdit = !!payment;
  openModal(isEdit ? 'تعديل الدفعة' : 'دفعة جديدة', `
    <div class="form-group">
      <label>العقد *</label>
      <select id="f-contract">${contractOptions(contracts, payment?.contractId)}</select>
    </div>
    <div class="form-group">
      <label>نوع الدفعة *</label>
      <select id="f-type">${paymentTypeOptions(payment?.type || 'period')}</select>
    </div>
    <div class="form-row" id="period-row" style="${payment?.type === 'advance' ? 'display:none' : ''}">
      <div class="form-group">
        <label>الفترة من *</label>
        <input type="date" id="f-period-start" value="${payment?.periodStart || ''}">
      </div>
      <div class="form-group">
        <label>الفترة إلى</label>
        <input type="date" id="f-period-end" value="${payment?.periodEnd || ''}">
      </div>
    </div>
    <div class="form-row" id="due-row" style="${payment?.type !== 'advance' ? 'display:none' : ''}">
      <div class="form-group">
        <label>تاريخ الاستحقاق *</label>
        <input type="date" id="f-due" value="${payment?.dueDate || todayISO()}">
      </div>
    </div>
    <div class="form-row">
      <div class="form-group">
        <label>المبلغ *</label>
        <input type="number" id="f-amount" min="0" value="${payment?.amount || ''}">
      </div>
    </div>
    <p class="muted small" id="due-hint" style="${payment?.type === 'advance' ? 'display:none' : ''}">تاريخ الاستحقاق هياخد نفس تاريخ بداية الفترة تلقائيًا.</p>
  `, `
    <button class="btn btn-ghost" onclick="closeModal()">إلغاء</button>
    <button class="btn btn-primary" id="save-payment-btn">${isEdit ? 'حفظ التعديل' : 'إضافة'}</button>
  `);

  document.getElementById('f-type').onchange = (e) => {
    const isAdvance = e.target.value === 'advance';
    document.getElementById('period-row').style.display = isAdvance ? 'none' : '';
    document.getElementById('due-row').style.display = isAdvance ? '' : 'none';
    document.getElementById('due-hint').style.display = isAdvance ? 'none' : '';
  };

  document.getElementById('save-payment-btn').onclick = async () => {
    const contractId = document.getElementById('f-contract').value;
    const type = document.getElementById('f-type').value;
    const amount = Number(document.getElementById('f-amount').value);
    const periodStart = document.getElementById('f-period-start').value;

    if (!contractId || !amount) return toast('استكمل الحقول المطلوبة (*)', 'error');
    if (type === 'period' && !periodStart) return toast('حدد تاريخ بداية الفترة', 'error');
    if (type === 'advance' && !document.getElementById('f-due').value) return toast('حدد تاريخ الاستحقاق', 'error');

    const data = {
      contractId,
      type,
      periodStart: type === 'period' ? periodStart : null,
      periodEnd: type === 'period' ? document.getElementById('f-period-end').value : null,
      amount,
      dueDate: type === 'period' ? periodStart : document.getElementById('f-due').value
    };

    if (isEdit) {
      await updateDoc(COL.payments, payment.id, data);
      toast('تم حفظ التعديل');
    } else {
      data.paidDate = null;
      data.paidCompany = null;
      await addDoc(COL.payments, data);
      toast('تمت إضافة الدفعة');
    }
    closeModal();
    navigate('payments');
  };
}

function openMarkPaidForm(payment) {
  openModal('تسجيل الدفع', `
    <div class="form-group">
      <label>تاريخ الدفع الفعلي *</label>
      <input type="date" id="f-paid-date" value="${todayISO()}">
    </div>
    <div class="form-group">
      <label>دُفعت من شركة *</label>
      <select id="f-paid-company">${companyOptions()}</select>
    </div>
  `, `
    <button class="btn btn-ghost" onclick="closeModal()">إلغاء</button>
    <button class="btn btn-primary" id="confirm-paid-btn">تأكيد الدفع</button>
  `);

  document.getElementById('confirm-paid-btn').onclick = async () => {
    const paidDate = document.getElementById('f-paid-date').value;
    const paidCompany = document.getElementById('f-paid-company').value;
    if (!paidDate || !paidCompany) return toast('استكمل الحقول المطلوبة', 'error');

    await updateDoc(COL.payments, payment.id, { paidDate, paidCompany });
    toast('تم تسجيل الدفع');
    closeModal();
    navigate('payments');
  };
}
