// ==========================================================================
// صفحة التقارير — كشف حساب سكن كامل (عقد + دفعات + كهرباء + مياه + مصاريف)
// الطباعة بتتم عن طريق طباعة المتصفح (Ctrl+P > حفظ كـ PDF) — أفضل حل للعربي RTL
// من نفس الطريقة اللي اتستخدمت قبل كده في نظام الأسطول (Arabic print-to-PDF)
// ==========================================================================

async function renderReports(container) {
  const residences = await fetchAll(COL.residences, 'name');

  container.innerHTML = `
    <div class="page-head"><h2>التقارير</h2></div>

    <div class="report-form card">
      ${residences.length === 0 ? `<div class="empty-state">لازم تضيف سكن الأول من صفحة "المساكن".</div>` : `
        <div class="form-row">
          <div class="form-group">
            <label>السكن *</label>
            <select id="rep-residence">${residenceOptions(residences)}</select>
          </div>
        </div>
        <div class="form-row">
          <div class="form-group">
            <label>من تاريخ (اختياري)</label>
            <input type="date" id="rep-from">
          </div>
          <div class="form-group">
            <label>إلى تاريخ (اختياري)</label>
            <input type="date" id="rep-to">
          </div>
        </div>
        <button class="btn btn-primary" id="rep-generate-btn">إنشاء الكشف</button>
      `}
    </div>

    <div id="report-preview"></div>
  `;

  if (residences.length === 0) return;

  document.getElementById('rep-generate-btn').onclick = () => generateResidenceStatement(residences);
}

async function generateResidenceStatement(residences) {
  const residenceId = document.getElementById('rep-residence').value;
  const from = document.getElementById('rep-from').value;
  const to = document.getElementById('rep-to').value;
  const residence = residences.find(r => r.id === residenceId);

  const btn = document.getElementById('rep-generate-btn');
  btn.disabled = true;
  btn.textContent = 'جارِ التجهيز...';

  const [contracts, allPayments, elecMeters, allElecBills, waterMeters, allWaterBills, expenses] = await Promise.all([
    fetchWhere(COL.contracts, 'residenceId', '==', residenceId),
    fetchAll(COL.payments),
    fetchWhere(COL.electricityMeters, 'residenceId', '==', residenceId),
    fetchAll(COL.electricityBills),
    fetchWhere(COL.waterMeters, 'residenceId', '==', residenceId),
    fetchAll(COL.waterBills),
    fetchWhere(COL.expenses, 'residenceId', '==', residenceId)
  ]);

  const contractIds = contracts.map(c => c.id);
  const elecMeterIds = elecMeters.map(m => m.id);
  const waterMeterIds = waterMeters.map(m => m.id);

  const inRange = (dateStr) => {
    if (!from && !to) return true;
    if (from && dateStr < from) return false;
    if (to && dateStr > to) return false;
    return true;
  };

  const payments = allPayments.filter(p => contractIds.includes(p.contractId) && inRange(p.dueDate));
  const elecBills = allElecBills.filter(b => elecMeterIds.includes(b.meterId) && inRange(b.date));
  const waterBills = allWaterBills.filter(b => waterMeterIds.includes(b.meterId) && inRange(b.date));
  const filteredExpenses = expenses.filter(e => inRange(e.date));

  const html = buildStatementHTML({ residence, contracts, payments, elecMeters, elecBills, waterMeters, waterBills, expenses: filteredExpenses, from, to });

  document.getElementById('report-preview').innerHTML = `
    <div class="report-actions">
      <button class="btn btn-primary" id="print-report-btn">🖨 طباعة / حفظ PDF</button>
    </div>
    <div class="report-sheet">${html}</div>
  `;

  document.getElementById('print-report-btn').onclick = () => {
    document.getElementById('print-report').innerHTML = html;
    window.print();
  };

  btn.disabled = false;
  btn.textContent = 'إنشاء الكشف';
}

function buildStatementHTML({ residence, contracts, payments, elecMeters, elecBills, waterMeters, waterBills, expenses, from, to }) {
  const periodTxt = (from || to) ? `${from ? fmtDate(from) : 'البداية'} → ${to ? fmtDate(to) : 'اليوم'}` : 'كل الفترة';

  // ---------- العقود ----------
  const contractsRows = contracts.length === 0 ? `<tr><td colspan="6">لا يوجد عقود لهذا السكن</td></tr>` : contracts.map(c => `
    <tr>
      <td>${esc(c.contractNumber)}</td>
      <td>${esc(c.ownerName || '—')}</td>
      <td>${fmtDate(c.startDate)}</td>
      <td>${fmtDate(c.endDate)}</td>
      <td>${fmtMoney(c.totalValue)}</td>
      <td>${daysBetween(c.endDate) >= 0 ? 'ساري' : 'منتهي'}</td>
    </tr>
  `).join('');

  // ---------- الدفعات ----------
  const rentPaidTotal = payments.filter(p => p.paidDate).reduce((s, p) => s + Number(p.amount || 0), 0);
  const rentOutstandingTotal = payments.filter(p => !p.paidDate).reduce((s, p) => s + Number(p.amount || 0), 0);

  const paymentsRows = payments.length === 0 ? `<tr><td colspan="6">لا توجد دفعات في هذه الفترة</td></tr>` : payments.map(p => `
    <tr>
      <td>${p.type === 'advance' ? 'دفعة مقدمة' : `${fmtDate(p.periodStart)} → ${fmtDate(p.periodEnd)}`}</td>
      <td>${fmtMoney(p.amount)}</td>
      <td>${fmtDate(p.dueDate)}</td>
      <td>${p.paidDate ? fmtDate(p.paidDate) : '—'}</td>
      <td>${esc(p.paidCompany || '—')}</td>
      <td>${p.paidDate ? 'مدفوعة' : (daysBetween(p.dueDate) < 0 ? 'متأخرة' : 'قادمة')}</td>
    </tr>
  `).join('');

  // ---------- الكهرباء ----------
  const elecMeterMap = Object.fromEntries(elecMeters.map(m => [m.id, m]));
  const elecTotal = elecBills.reduce((s, b) => s + Number(b.amount || 0), 0);
  const elecRows = elecBills.length === 0 ? `<tr><td colspan="4">لا توجد فواتير كهرباء في هذه الفترة</td></tr>` : elecBills.map(b => `
    <tr>
      <td>${esc(elecMeterMap[b.meterId]?.meterNumber || '—')}</td>
      <td>${fmtDate(b.date)}</td>
      <td>${fmtMoney(b.amount)}</td>
      <td>${esc(b.paidCompany || '—')}</td>
    </tr>
  `).join('');

  // ---------- المياه ----------
  const waterMeterMap = Object.fromEntries(waterMeters.map(m => [m.id, m]));
  const waterTotal = waterBills.reduce((s, b) => s + Number(b.amount || 0), 0);
  const waterRows = waterBills.length === 0 ? `<tr><td colspan="4">لا توجد فواتير مياه في هذه الفترة</td></tr>` : waterBills.map(b => `
    <tr>
      <td>${esc(waterMeterMap[b.meterId]?.meterNumber || '—')}</td>
      <td>${fmtDate(b.date)}</td>
      <td>${fmtMoney(b.amount)}</td>
      <td>${esc(b.paidCompany || '—')}</td>
    </tr>
  `).join('');

  // ---------- المصاريف ----------
  const expensesTotal = expenses.reduce((s, e) => s + Number(e.amount || 0), 0);
  const expensesRows = expenses.length === 0 ? `<tr><td colspan="4">لا توجد مصاريف في هذه الفترة</td></tr>` : expenses.map(e => `
    <tr>
      <td>${esc(e.description)}</td>
      <td>${fmtDate(e.date)}</td>
      <td>${fmtMoney(e.amount)}</td>
      <td>${esc(e.paidCompany || '—')}</td>
    </tr>
  `).join('');

  // ---------- التوزيع حسب الشركة ----------
  const byCompany = {};
  const addToCompany = (company, amount) => {
    if (!company) return;
    byCompany[company] = (byCompany[company] || 0) + Number(amount || 0);
  };
  payments.filter(p => p.paidDate).forEach(p => addToCompany(p.paidCompany, p.amount));
  elecBills.forEach(b => addToCompany(b.paidCompany, b.amount));
  waterBills.forEach(b => addToCompany(b.paidCompany, b.amount));
  expenses.forEach(e => addToCompany(e.paidCompany, e.amount));

  const companyRows = Object.keys(byCompany).length === 0
    ? `<tr><td colspan="2">لا يوجد مدفوعات مسجلة</td></tr>`
    : Object.entries(byCompany).map(([company, amount]) => `
      <tr><td>${esc(company)}</td><td>${fmtMoney(amount)}</td></tr>
    `).join('');

  const grandTotalPaid = rentPaidTotal + elecTotal + waterTotal + expensesTotal;

  return `
    <h1>كشف حساب سكن</h1>
    <p class="report-meta">
      السكن: <strong>${esc(residence.name)}</strong> ${residence.address ? `— ${esc(residence.address)}` : ''}<br>
      الفترة: ${periodTxt} · تاريخ الطباعة: ${fmtDate(todayISO())}
    </p>

    <h3>العقود</h3>
    <table class="report-table">
      <thead><tr><th>رقم العقد</th><th>المالك</th><th>البداية</th><th>النهاية</th><th>القيمة الإجمالية</th><th>الحالة</th></tr></thead>
      <tbody>${contractsRows}</tbody>
    </table>

    <h3>الدفعات (الإيجار)</h3>
    <table class="report-table">
      <thead><tr><th>الفترة</th><th>المبلغ</th><th>الاستحقاق</th><th>تاريخ الدفع</th><th>دُفعت من</th><th>الحالة</th></tr></thead>
      <tbody>
        ${paymentsRows}
        <tr class="report-total-row"><td colspan="1">الإجمالي</td><td>${fmtMoney(rentPaidTotal)} مدفوع</td><td colspan="4">${fmtMoney(rentOutstandingTotal)} مستحق غير مدفوع</td></tr>
      </tbody>
    </table>

    <h3>الكهرباء</h3>
    <table class="report-table">
      <thead><tr><th>رقم العداد</th><th>التاريخ</th><th>المبلغ</th><th>دُفعت من</th></tr></thead>
      <tbody>
        ${elecRows}
        <tr class="report-total-row"><td colspan="2">الإجمالي</td><td colspan="2">${fmtMoney(elecTotal)}</td></tr>
      </tbody>
    </table>

    <h3>المياه</h3>
    <table class="report-table">
      <thead><tr><th>رقم العداد</th><th>التاريخ</th><th>المبلغ</th><th>دُفعت من</th></tr></thead>
      <tbody>
        ${waterRows}
        <tr class="report-total-row"><td colspan="2">الإجمالي</td><td colspan="2">${fmtMoney(waterTotal)}</td></tr>
      </tbody>
    </table>

    <h3>مصاريف السكن</h3>
    <table class="report-table">
      <thead><tr><th>الوصف</th><th>التاريخ</th><th>المبلغ</th><th>دُفعت من</th></tr></thead>
      <tbody>
        ${expensesRows}
        <tr class="report-total-row"><td colspan="2">الإجمالي</td><td colspan="2">${fmtMoney(expensesTotal)}</td></tr>
      </tbody>
    </table>

    <div class="report-summary-grid">
      <div class="report-summary-box"><span class="num">${fmtMoney(rentPaidTotal)}</span><span class="lbl">إيجار مدفوع</span></div>
      <div class="report-summary-box"><span class="num">${fmtMoney(elecTotal)}</span><span class="lbl">كهرباء</span></div>
      <div class="report-summary-box"><span class="num">${fmtMoney(waterTotal)}</span><span class="lbl">مياه</span></div>
      <div class="report-summary-box"><span class="num">${fmtMoney(expensesTotal)}</span><span class="lbl">مصاريف</span></div>
      <div class="report-summary-box"><span class="num">${fmtMoney(grandTotalPaid)}</span><span class="lbl">إجمالي المدفوع فعليًا</span></div>
      <div class="report-summary-box"><span class="num">${fmtMoney(rentOutstandingTotal)}</span><span class="lbl">إيجار مستحق غير مدفوع</span></div>
    </div>

    <h3>التوزيع حسب الشركة (المدفوع فعليًا)</h3>
    <table class="report-table">
      <thead><tr><th>الشركة</th><th>المبلغ</th></tr></thead>
      <tbody>${companyRows}</tbody>
    </table>
  `;
}
