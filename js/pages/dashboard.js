// ==========================================================================
// لوحة التحكم — أول ما يفتح المستخدم التطبيق يشوف التنبيهات هنا مباشرة
// ==========================================================================

async function renderDashboard(container) {
  const [payments, contracts, residences] = await Promise.all([
    fetchAll(COL.payments, 'dueDate'),
    fetchAll(COL.contracts),
    fetchAll(COL.residences)
  ]);

  const resMap = Object.fromEntries(residences.map(r => [r.id, r.name]));
  const contractMap = Object.fromEntries(contracts.map(c => [c.id, c]));

  const unpaid = payments.filter(p => !p.paidDate);
  const overdue = unpaid.filter(p => computePaymentStatus(p) === 'overdue');
  const upcoming = unpaid.filter(p => computePaymentStatus(p) === 'upcoming');
  const activeContracts = contracts.filter(c => daysBetween(c.endDate) >= 0);

  container.innerHTML = `
    <div class="stat-grid">
      <div class="stat-card">
        <span class="stat-num">${residences.length}</span>
        <span class="stat-label">مساكن</span>
      </div>
      <div class="stat-card">
        <span class="stat-num">${activeContracts.length}</span>
        <span class="stat-label">عقود سارية</span>
      </div>
      <div class="stat-card stat-warn">
        <span class="stat-num">${upcoming.length}</span>
        <span class="stat-label">دفعات قريبة</span>
      </div>
      <div class="stat-card stat-danger">
        <span class="stat-num">${overdue.length}</span>
        <span class="stat-label">دفعات متأخرة</span>
      </div>
    </div>

    ${overdue.length + upcoming.length === 0 ? `
      <div class="empty-state big">مفيش تنبيهات دلوقتي. كل الدفعات في موعدها. ✅</div>
    ` : `
      ${overdue.length > 0 ? `
        <h3 class="section-sub alert-danger">دفعات متأخرة</h3>
        <div class="alert-list" id="overdue-list"></div>
      ` : ''}
      ${upcoming.length > 0 ? `
        <h3 class="section-sub alert-warn">دفعات مستحقة قريبًا (خلال ${ALERT_DAYS_BEFORE} أيام)</h3>
        <div class="alert-list" id="upcoming-list"></div>
      ` : ''}
    `}
  `;

  const renderAlertRow = (p) => {
    const c = contractMap[p.contractId] || {};
    const days = daysBetween(p.dueDate);
    const daysTxt = days < 0 ? `متأخرة ${Math.abs(days)} يوم` : (days === 0 ? 'مستحقة اليوم' : `متبقي ${days} يوم`);
    return `
      <div class="alert-row">
        <div class="alert-main">
          <strong>${esc(resMap[c.residenceId] || '—')}</strong>
          <span class="muted">عقد ${esc(c.contractNumber || '—')}</span>
        </div>
        <div class="alert-mid">
          <span>${fmtMoney(p.amount)}</span>
          <span class="muted">استحقاق ${fmtDate(p.dueDate)}</span>
          <span class="days-left">${daysTxt}</span>
        </div>
        <button class="btn btn-sm btn-ok" data-pay="${p.id}">تم الدفع</button>
      </div>
    `;
  };

  const overdueList = document.getElementById('overdue-list');
  if (overdueList) overdueList.innerHTML = overdue.map(renderAlertRow).join('');

  const upcomingList = document.getElementById('upcoming-list');
  if (upcomingList) upcomingList.innerHTML = upcoming.map(renderAlertRow).join('');

  container.querySelectorAll('[data-pay]').forEach(b => {
    b.onclick = () => openMarkPaidForm(payments.find(p => p.id === b.dataset.pay));
  });
}
