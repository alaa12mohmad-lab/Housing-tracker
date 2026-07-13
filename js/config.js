// ==========================================================================
// إعدادات النظام العامة
// عدّل هنا فقط عند إضافة شركة جديدة أو تغيير سلوك التنبيهات
// ==========================================================================

// قائمة الشركات التي يمكن الدفع منها - أضف/احذف من هنا وستتحدث كل القوائم تلقائيًا
const COMPANIES = [
  'عيون الحديد',
  'ريان القرني',
  'القيادة الذكية'
];

// كم يوم قبل الاستحقاق يبدأ التنبيه بالظهور
const ALERT_DAYS_BEFORE = 7;

// من يدفع فاتورة الكهرباء/المياه
const PAYER_TYPES = [
  { value: 'company', label: 'الشركة' },
  { value: 'owner', label: 'المالك' },
  { value: 'workers', label: 'العمال أنفسهم' }
];

// نوع الدفعة في العقد
const PAYMENT_TYPES = [
  { value: 'period', label: 'دفعة عن فترة' },
  { value: 'advance', label: 'دفعة مقدمة' }
];

// دورية الدفع في العقد
const PAYMENT_FREQUENCIES = [
  { value: 1, label: 'شهري' },
  { value: 3, label: 'كل 3 شهور' },
  { value: 6, label: 'كل 6 شهور' },
  { value: 12, label: 'سنوي' }
];

// إعدادات Firebase — استبدل بالقيم الخاصة بمشروعك (من Firebase Console > Project Settings)
const FIREBASE_CONFIG = {
  apiKey: "AIzaSyBJb7b5pJ7vCAYnNULG4TcXjKJs-UkxllA",
  authDomain: "housing-tracker-87679.firebaseapp.com",
  projectId: "housing-tracker-87679",
  storageBucket: "housing-tracker-87679.firebasestorage.app",
  messagingSenderId: "874995055975",
  appId: "1:874995055975:web:33f495648a50be113c43c2"
};
