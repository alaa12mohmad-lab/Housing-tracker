// ==========================================================================
// راوتر التطبيق — كل صفحة عبارة عن كائن فيه render() و(اختياري) destroy()
// لإضافة صفحة جديدة مستقبلاً: أضفها في PAGES فقط، وباقي النظام (القائمة، التنقل) هيشتغل تلقائي
// ==========================================================================

const PAGES = {
  dashboard: { title: 'الرئيسية', icon: '🏠', render: renderDashboard },
  residences: { title: 'المساكن', icon: '🏢', render: renderResidences },
  contracts: { title: 'العقود', icon: '📄', render: renderContracts },
  payments: { title: 'الدفعات', icon: '💰', render: renderPayments },
  electricity: { title: 'الكهرباء', icon: '⚡', render: renderElectricity },
  water: { title: 'المياه', icon: '💧', render: renderWater },
  expenses: { title: 'المصاريف', icon: '🧾', render: renderExpenses },
  reports: { title: 'التقارير', icon: '🖨️', render: renderReports }
};

let currentPage = null;

function buildNav() {
  const nav = document.getElementById('side-nav');
  nav.innerHTML = Object.entries(PAGES).map(([key, p]) => `
    <button class="nav-item" data-page="${key}">
      <span class="nav-icon">${p.icon}</span>
      <span class="nav-label">${p.title}</span>
    </button>
  `).join('');

  nav.querySelectorAll('.nav-item').forEach(btn => {
    btn.addEventListener('click', () => navigate(btn.dataset.page));
  });
}

function navigate(pageKey) {
  if (!PAGES[pageKey]) pageKey = 'dashboard';
  currentPage = pageKey;
  location.hash = pageKey;

  document.querySelectorAll('.nav-item').forEach(b => {
    b.classList.toggle('active', b.dataset.page === pageKey);
  });
  document.getElementById('page-title').textContent = PAGES[pageKey].title;

  const container = document.getElementById('page-container');
  container.innerHTML = '<div class="loading">جارِ التحميل...</div>';
  PAGES[pageKey].render(container);
}

window.addEventListener('hashchange', () => {
  const key = location.hash.replace('#', '') || 'dashboard';
  navigate(key);
});

function initRouter() {
  buildNav();
  const key = location.hash.replace('#', '') || 'dashboard';
  navigate(key);
}
