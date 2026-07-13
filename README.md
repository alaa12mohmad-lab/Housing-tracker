# تتبع إيجارات مساكن الشركة

تطبيق PWA مستقل (Firebase + Vanilla JS) لمتابعة عقود إيجار مساكن الشركات الثلاث، الدفعات، الكهرباء، المياه، والمصاريف.

## خطوات التشغيل

### 1. إنشاء مشروع Firebase (مجاني)
1. روح على https://console.firebase.google.com وسجل دخول بنفس حساب Google بتاعك.
2. اعمل **Add project** واختار اسم زي `housing-tracker`.
3. من القائمة الجانبية: **Build > Firestore Database > Create database** → اختار **Start in production mode** → اختار أقرب منطقة (مثلاً `eur3` أو `me-central`).
4. من **Project settings > General**، انزل لـ "Your apps" واعمل **Web app** (أيقونة `</>`) وسمّيها اي حاجة.
5. هيديك كائن `firebaseConfig` — انسخ القيم دي وحطها في ملف `js/config.js` بدل الأماكن المكتوب فيها `PASTE_...`.

### 2. تفعيل تسجيل الدخول (Firebase Authentication)
1. من القائمة الجانبية: **Build > Authentication > Get started**.
2. من تبويب **Sign-in method**، فعّل **Email/Password**.
3. من تبويب **Users**، اعمل **Add user** وحط إيميلك وكلمة مرور قوية — ده حساب الدخول للتطبيق.
4. لو عاوز تضيف شخص تاني (محاسب مساعد مثلاً) لاحقًا: كرر نفس الخطوة بإيميله — مفيش تعديل كود مطلوب.

### 3. قواعد الأمان (Firestore Rules)
افتح **Firestore Database > Rules** والصق ده:

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /{document=**} {
      allow read, write: if request.auth != null;
    }
  }
}
```

القاعدة دي معناها: محدش يقدر يقرأ أو يكتب أي بيانات غير لو عامل تسجيل دخول ناجح بحساب من اللي أضفته في الخطوة اللي فاتت.

> **ملحوظة مهمة عن مفتاح Firebase:** مفتاح الـ `apiKey` في `config.js` مش سر — لازم يظهر في كود المتصفح عشان التطبيق يشتغل، وده طبيعي وموثق رسميًا من Google. الحماية الفعلية هي **Authentication + Rules** اللي عملناهم فوق، مش إخفاء المفتاح. لو عاوز طبقة حماية إضافية اختيارية: من **Google Cloud Console > APIs & Services > Credentials** تقدر تقيّد المفتاح بحيث يشتغل بس من دومين الـ GitHub Pages بتاعك.

### 4. الرفع على GitHub Pages
1. اعمل repo جديد على GitHub (مثلاً `housing-tracker`).
2. ارفع كل الملفات اللي في المجلد ده كما هي.
3. من **Settings > Pages** فعّل النشر من فرع `main`.
4. هيديك لينك زي `https://username.github.io/housing-tracker/` — افتحه من الموبايل واعمل "إضافة إلى الشاشة الرئيسية" عشان يشتغل كتطبيق.

## بنية المشروع (عشان أي تطوير مستقبلي)

```
index.html              نقطة الدخول + الهيكل العام
css/style.css           كل التصميم
js/config.js            الشركات + إعدادات التنبيه + إعدادات Firebase
js/firebase-init.js     تهيئة Firebase وأسماء الـ collections
js/auth.js              تسجيل الدخول والخروج
js/utils.js             دوال مشتركة (مودال، توست، تواريخ، شارات حالة)
js/db.js                عمليات CRUD عامة فوق Firestore
js/router.js            التنقل بين الصفحات (SPA)
js/pages/*.js           كل صفحة في ملف مستقل
```

## لإضافة ميزة جديدة مستقبلًا
- **صفحة جديدة كاملة**: أضف ملف في `js/pages/`، وأضف سطر واحد في `PAGES` بملف `router.js` — القائمة الجانبية هتتحدث تلقائي.
- **شركة جديدة**: أضفها في مصفوفة `COMPANIES` بملف `config.js` فقط.
- **حقل جديد في أي نموذج**: عدّل `openXForm()` في ملف الصفحة نفسها، وعدّل الـ `data` object اللي بيتحفظ في Firestore (مفيش migration مطلوب، Firestore مرن).

