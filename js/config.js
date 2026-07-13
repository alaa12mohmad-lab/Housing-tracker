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
const ALERT_DAYS_BEFORE = 10;

// مين المسؤول عن الكهرباء حسب العقد
const ELECTRICITY_ARRANGEMENTS = [
  { value: 'included', label: 'داخل الإيجار (المالك مسؤول)' },
  { value: 'separate', label: 'خارج العقد (تُدفع منفصلة)' }
];

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
  apiKey: "PASTE_YOUR_API_KEY",
  authDomain: "PASTE_YOUR_PROJECT.firebaseapp.com",
  projectId: "PASTE_YOUR_PROJECT_ID",
  storageBucket: "PASTE_YOUR_PROJECT.appspot.com",
  messagingSenderId: "PASTE_YOUR_SENDER_ID",
  appId: "PASTE_YOUR_APP_ID"
};
