// ==========================================================================
// تهيئة Firebase — لا تحتاج تعديل، الإعدادات في config.js
// ==========================================================================

firebase.initializeApp(FIREBASE_CONFIG);
const db = firebase.firestore();

// تفعيل التخزين المحلي المؤقت (يشتغل بدون نت لو البيانات محملة قبل كده)
db.enablePersistence({ synchronizeTabs: true }).catch(err => {
  console.warn('Persistence not enabled:', err.code);
});

// أسماء المجموعات (Collections) في Firestore — مركزية عشان لو حبيت تغيرها تتغير من مكان واحد
const COL = {
  residences: db.collection('residences'),
  contracts: db.collection('contracts'),
  payments: db.collection('payments'),
  electricityMeters: db.collection('electricityMeters'),
  electricityBills: db.collection('electricityBills'),
  waterMeters: db.collection('waterMeters'),
  waterBills: db.collection('waterBills'),
  expenses: db.collection('expenses')
};
