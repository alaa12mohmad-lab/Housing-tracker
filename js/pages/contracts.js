// ==========================================================================
// صفحة العقود
// ==========================================================================

async function renderContracts(container) {
  const [contracts, residences] = await Promise.all([
    fetchAll(COL.contracts, 'startDate', true),
    fetchAll(COL.residences, 'name')
  ]);

  const resMap = Object.fromEntries(residences.map(r => [r.id, r.name]));

  container.innerHTML = `
    <div class="page-head">
      <h2>العقود</h2>
      <button class="btn btn-primary" id="add-contract-btn" ${residences.length === 0 ? 'disabled title="أضف سكن أولاً"' : ''}>+ عقد جديد</button>
    </div>
    <div class="table-wrap">
      <table class="data-table" id="contracts-table">
        <thead>
          <tr>
            <th>رقم العقد</th><th>السكن</th><th>المالك</th><th>البداية</th><th>النهاية</th>
            <th>القيمة الإجمالية</th><th>الحالة</th><th></th>
          </tr>
        </thead>
        <tbody></tbody>
      </table>
    </div>
  `;

  if (residences.length === 0) {
    container.querySelector('.table-wrap').innerHTML = `<div class="empty-state">لازم تضيف سكن الأول من صفحة "المساكن".</div>`;
  }

  document.getElementById('add-contract-btn').onclick = () => openContractForm(residences);

  const tbody = document.querySelector('#contracts-table tbody');
  if (contracts.length === 0) {
    tbody.innerHTML = `<tr><td colspan="8" class="empty-state">لسه مفيش عقود.</td></tr>`;
  } else {
    tbody.innerHTML = contracts.map(c => {
      const isActive = daysBetween(c.endDate) >= 0;
      return `
        <tr>
          <td>${esc(c.contractNumber)}</td>
          <td>${esc(resMap[c.residenceId] || '—')}</td>
          <td>${esc(c.ownerName || '—')}</td>
          <td>${fmtDate(c.startDate)}</td>
          <td>${fmtDate(c.endDate)}</td>
          <td>${fmtMoney(c.totalValue)}</td>
          <td>${isActive ? '<span class="badge badge-ok">ساري</span>' : '<span class="badge badge-danger">منتهي</span>'}</td>
          <td class="row-actions">
            <button class="icon-btn" data-edit="${c.id}">✎</button>
            <button class="icon-btn" data-del="${c.id}">🗑</button>
          </td>
        </tr>
      `;
    }).join('');
  }

  tbody.querySelectorAll('[data-edit]').forEach(b => {
    b.onclick = () => openContractForm(residences, contracts.find(c => c.id === b.dataset.edit));
  });
  tbody.querySelectorAll('[data-del]').forEach(b => {
    b.onclick = () => {
      confirmDelete('هيتم حذف العقد. الدفعات المرتبطة به لن تُحذف تلقائيًا — راجعها من صفحة الدفعات.', async () => {
        await deleteDoc(COL.contracts, b.dataset.del);
        toast('تم حذف العقد');
        navigate('contracts');
      });
    };
  });
}

function openContractForm(residences, contract = null) {
  const isEdit = !!contract;
  openModal(isEdit ? 'تعديل العقد' : 'عقد جديد', `
    <div class="form-row">
      <div class="form-group">
        <label>السكن *</label>
        <select id="f-residence">${residenceOptions(residences, contract?.residenceId)}</select>
      </div>
      <div class="form-group">
        <label>رقم العقد *</label>
        <input type="text" id="f-number" value="${esc(contract?.contractNumber || '')}">
      </div>
    </div>
    <div class="form-row">
      <div class="form-group">
        <label>اسم المالك</label>
        <input type="text" id="f-owner" value="${esc(contract?.ownerName || '')}">
      </div>
      <div class="form-group">
        <label>رقم تواصل المالك</label>
        <input type="text" id="f-owner-contact" value="${esc(contract?.ownerContact || '')}">
      </div>
    </div>
    <div class="form-row">
      <div class="form-group">
        <label>تاريخ بداية العقد *</label>
        <input type="date" id="f-start" value="${contract?.startDate || todayISO()}">
      </div>
      <div class="form-group">
        <label>مدة العقد (بالشهور) *</label>
        <input type="number" id="f-duration" min="1" value="${contract?.durationMonths || 12}">
      </div>
    </div>
    <div class="form-row">
      <div class="form-group">
        <label>القيمة الإجمالية للعقد *</label>
        <input type="number" id="f-total" min="0" value="${contract?.totalValue || ''}">
      </div>
      <div class="form-group">
        <label>دورية الدفع</label>
        <select id="f-frequency">${frequencyOptions(contract?.paymentFrequency || 1)}</select>
      </div>
    </div>
    <p class="muted small">تاريخ نهاية العقد هيتحسب تلقائي من تاريخ البداية + المدة.</p>
  `, `
    <button class="btn btn-ghost" onclick="closeModal()">إلغاء</button>
    <button class="btn btn-primary" id="save-contract-btn">${isEdit ? 'حفظ التعديل' : 'إضافة'}</button>
  `);

  document.getElementById('save-contract-btn').onclick = async () => {
    const residenceId = document.getElementById('f-residence').value;
    const contractNumber = document.getElementById('f-number').value.trim();
    const startDate = document.getElementById('f-start').value;
    const durationMonths = Number(document.getElementById('f-duration').value);
    const totalValue = Number(document.getElementById('f-total').value);

    if (!residenceId || !contractNumber || !startDate || !durationMonths) {
      return toast('استكمل الحقول المطلوبة (*)', 'error');
    }

    const data = {
      residenceId,
      contractNumber,
      ownerName: document.getElementById('f-owner').value.trim(),
      ownerContact: document.getElementById('f-owner-contact').value.trim(),
      startDate,
      durationMonths,
      endDate: addMonths(startDate, durationMonths),
      totalValue,
      paymentFrequency: Number(document.getElementById('f-frequency').value)
    };

    if (isEdit) {
      await updateDoc(COL.contracts, contract.id, data);
      toast('تم حفظ التعديل');
    } else {
      await addDoc(COL.contracts, data);
      toast('تمت إضافة العقد');
    }
    closeModal();
    navigate('contracts');
  };
}
