// ==========================================================================
// طبقة وصول بيانات عامة — كل صفحة تستخدم هذه الدوال بدل ما تكتب كود Firestore بنفسها
// ==========================================================================

// جلب كل المستندات في مجموعة مرة واحدة (بدون استماع مباشر)، مرتبة اختياريًا
async function fetchAll(collectionRef, orderField = null, desc = false) {
  let q = collectionRef;
  if (orderField) q = q.orderBy(orderField, desc ? 'desc' : 'asc');
  const snap = await q.get();
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
}

async function fetchWhere(collectionRef, field, op, value) {
  const snap = await collectionRef.where(field, op, value).get();
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
}

async function addDoc(collectionRef, data) {
  data.createdAt = firebase.firestore.FieldValue.serverTimestamp();
  const ref = await collectionRef.add(data);
  return ref.id;
}

async function updateDoc(collectionRef, id, data) {
  data.updatedAt = firebase.firestore.FieldValue.serverTimestamp();
  await collectionRef.doc(id).update(data);
}

async function deleteDoc(collectionRef, id) {
  await collectionRef.doc(id).delete();
}
