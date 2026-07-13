// ==========================================================================
// طبقة تسجيل الدخول — التطبيق مايفتحش ولا يقرأ/يكتب في Firestore غير بعد تسجيل الدخول
// لإضافة مستخدم جديد: Firebase Console > Authentication > Users > Add user (مفيش تعديل كود مطلوب)
// ==========================================================================

let routerStarted = false;

firebase.auth().onAuthStateChanged(user => {
  const loginScreen = document.getElementById('login-screen');
  const appShell = document.getElementById('app-shell');

  if (user) {
    loginScreen.style.display = 'none';
    appShell.style.display = 'flex';
    document.getElementById('user-email').textContent = user.email;

    if (!routerStarted) {
      routerStarted = true;
      initRouter();
    }
  } else {
    loginScreen.style.display = 'flex';
    appShell.style.display = 'none';
  }
});

document.getElementById('login-form').addEventListener('submit', async (e) => {
  e.preventDefault();
  const email = document.getElementById('login-email').value.trim();
  const password = document.getElementById('login-password').value;
  const errBox = document.getElementById('login-error');
  const submitBtn = e.target.querySelector('button[type="submit"]');

  errBox.textContent = '';
  submitBtn.disabled = true;
  submitBtn.textContent = 'جارِ الدخول...';

  try {
    await firebase.auth().signInWithEmailAndPassword(email, password);
  } catch (err) {
    errBox.textContent = 'الإيميل أو كلمة المرور غير صحيحة';
  } finally {
    submitBtn.disabled = false;
    submitBtn.textContent = 'دخول';
  }
});

function logout() {
  firebase.auth().signOut();
  routerStarted = false;
}
