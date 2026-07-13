// ==========================================================================
// صفحة مصاريف السكن العامة — أي مصروف مش دفعة إيجار ومش فاتورة كهرباء/مياه
// ==========================================================================

async function renderExpenses(container) {
  const [expenses, residences] = await Promise.all([
    fetchAll(COL.expenses, 'date', true),
    fetchAll(COL.residences, 'name')
  ]);

  const resMap = Object.fromEntries(residences.map(r => [r.id, r.name]));

  container.innerHTML = `
    <div class="page-head">
      <h2>مصاريف السكن</h2>
      <button class="btn btn-primary" id="add-expense-btn" ${residences.length === 0 ? 'disabled title="أضف سكن أولاً"' : ''}>+ مصروف جديد</button>
    </div>
    <div class="table-wrap">
      <table class="data-table" id="expenses-table">
        <thead><tr><th>السكن</th><th>الوصف</th><th>التاريخ</th><th>المبلغ</th><th>دُفعت من</th><th></th></tr></thead>
        <tbody></tbody>
      </table>
    </div>
  `;

  if (residences.length === 0) {
    container.querySelector('.table-wrap').innerHTML = `<div class="empty-state">لازم تضيف سكن الأول.</div>`;
  }

  document.getElementById('add-expense-btn').onclick = () => openExpenseForm(residences);

  const tbody = document.querySelector('#expenses-table tbody');
  tbody.innerHTML = expenses.length === 0
    ? `<tr><td colspan="6" class="empty-state">لسه مفيش مصاريف مسجلة.</td></tr>`
    : expenses.map(e => `
      <tr>
        <td>${esc(resMap[e.residenceId] || '—')}</td>
        <td>${esc(e.description)}</td>
        <td>${fmtDate(e.date)}</td>
        <td>${fmtMoney(e.amount)}</td>
        <td>${esc(e.paidCompany || '—')}</td>
        <td class="row-actions">
          <button class="icon-btn" data-edit="${e.id}">✎</button>
          <button class="icon-btn" data-del="${e.id}">🗑</button>
        </td>
      </tr>
    `).join('');

  tbody.querySelectorAll('[data-edit]').forEach(b => {
    b.onclick = () => openExpenseForm(residences, expenses.find(e => e.id === b.dataset.edit));
  });
  tbody.querySelectorAll('[data-del]').forEach(b => {
    b.onclick = () => confirmDelete('هيتم حذف المصروف نهائيًا.', async () => {
      await deleteDoc(COL.expenses, b.dataset.del);
      toast('تم حذف المصروف');
      navigate('expenses');
    });
  });
}

function openExpenseForm(residences, expense = null) {
  const isEdit = !!expense;
  openModal(isEdit ? 'تعديل المصروف' : 'مصروف جديد', `
    <div class="form-group">
      <label>السكن *</label>
      <select id="f-residence">${residenceOptions(residences, expense?.residenceId)}</select>
    </div>
    <div class="form-group">
      <label>الوصف *</label>
      <input type="text" id="f-desc" value="${esc(expense?.description || '')}" placeholder="مثال: صيانة تكييف، شراء أثاث...">
    </div>
    <div class="form-row">
      <div class="form-group">
        <label>المبلغ *</label>
        <input type="number" id="f-amount" min="0" value="${expense?.amount || ''}">
      </div>
      <div class="form-group">
        <label>التاريخ *</label>
        <input type="date" id="f-date" value="${expense?.date || todayISO()}">
      </div>
    </div>
    <div class="form-group">
      <label>دُفعت من شركة *</label>
      <select id="f-company">${companyOptions(expense?.paidCompany)}</select>
    </div>
  `, `
    <button class="btn btn-ghost" onclick="closeModal()">إلغاء</button>
    <button class="btn btn-primary" id="save-expense-btn">${isEdit ? 'حفظ التعديل' : 'إضافة'}</button>
  `);

  document.getElementById('save-expense-btn').onclick = async () => {
    const residenceId = document.getElementById('f-residence').value;
    const description = document.getElementById('f-desc').value.trim();
    const amount = Number(document.getElementById('f-amount').value);
    const date = document.getElementById('f-date').value;
    const paidCompany = document.getElementById('f-company').value;

    if (!residenceId || !description || !amount || !date || !paidCompany) {
      return toast('استكمل الحقول المطلوبة', 'error');
    }

    const data = { residenceId, description, amount, date, paidCompany };

    if (isEdit) {
      await updateDoc(COL.expenses, expense.id, data);
      toast('تم حفظ التعديل');
    } else {
      await addDoc(COL.expenses, data);
      toast('تمت إضافة المصروف');
    }
    closeModal();
    navigate('expenses');
  };
}
