// ==========================================================================
// صفحة المساكن
// ==========================================================================

async function renderResidences(container) {
  const residences = await fetchAll(COL.residences, 'name');

  container.innerHTML = `
    <div class="page-head">
      <h2>المساكن</h2>
      <button class="btn btn-primary" id="add-residence-btn">+ سكن جديد</button>
    </div>
    <div class="card-grid" id="residences-grid"></div>
  `;

  document.getElementById('add-residence-btn').onclick = () => openResidenceForm();

  const grid = document.getElementById('residences-grid');
  if (residences.length === 0) {
    grid.innerHTML = `<div class="empty-state">لسه مفيش مساكن مضافة. ابدأ بإضافة أول سكن.</div>`;
    return;
  }

  grid.innerHTML = residences.map(r => `
    <div class="card residence-card">
      <div class="card-top">
        <h3>${esc(r.name)}</h3>
        <div class="card-menu">
          <button class="icon-btn" data-edit="${r.id}">✎</button>
          <button class="icon-btn" data-del="${r.id}">🗑</button>
        </div>
      </div>
      <p class="muted">${esc(r.address || 'بدون عنوان')}</p>
      ${r.notes ? `<p class="notes-line">${esc(r.notes)}</p>` : ''}
    </div>
  `).join('');

  grid.querySelectorAll('[data-edit]').forEach(b => {
    b.onclick = () => openResidenceForm(residences.find(r => r.id === b.dataset.edit));
  });
  grid.querySelectorAll('[data-del]').forEach(b => {
    b.onclick = () => {
      confirmDelete('هيتم حذف السكن نهائيًا. العقود والفواتير المرتبطة به لن تُحذف تلقائيًا — راجعها قبل الحذف.', async () => {
        await deleteDoc(COL.residences, b.dataset.del);
        toast('تم حذف السكن');
        navigate('residences');
      });
    };
  });
}

function openResidenceForm(residence = null) {
  const isEdit = !!residence;
  openModal(isEdit ? 'تعديل السكن' : 'سكن جديد', `
    <div class="form-group">
      <label>اسم السكن *</label>
      <input type="text" id="f-name" value="${esc(residence?.name || '')}" placeholder="مثال: سكن العمال - المخطط الصناعي">
    </div>
    <div class="form-group">
      <label>العنوان</label>
      <input type="text" id="f-address" value="${esc(residence?.address || '')}">
    </div>
    <div class="form-group">
      <label>ملاحظات</label>
      <textarea id="f-notes" rows="3">${esc(residence?.notes || '')}</textarea>
    </div>
  `, `
    <button class="btn btn-ghost" onclick="closeModal()">إلغاء</button>
    <button class="btn btn-primary" id="save-residence-btn">${isEdit ? 'حفظ التعديل' : 'إضافة'}</button>
  `);

  document.getElementById('save-residence-btn').onclick = async () => {
    const name = document.getElementById('f-name').value.trim();
    if (!name) return toast('اسم السكن مطلوب', 'error');

    const data = {
      name,
      address: document.getElementById('f-address').value.trim(),
      notes: document.getElementById('f-notes').value.trim()
    };

    if (isEdit) {
      await updateDoc(COL.residences, residence.id, data);
      toast('تم حفظ التعديل');
    } else {
      await addDoc(COL.residences, data);
      toast('تمت إضافة السكن');
    }
    closeModal();
    navigate('residences');
  };
}
