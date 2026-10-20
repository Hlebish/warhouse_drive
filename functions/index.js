const crypto = require('node:crypto');
const { onCall, HttpsError } = require('firebase-functions/v2/https');
const { defineSecret } = require('firebase-functions/params');
const { initializeApp } = require('firebase-admin/app');
const { getAuth } = require('firebase-admin/auth');
const { getFirestore, FieldValue, Timestamp } = require('firebase-admin/firestore');

initializeApp();
const db = getFirestore();
const DRIVER_PIN = defineSecret('DRIVER_PIN');
const MAX_ATTEMPTS = 5;
const LOCK_MS = 10 * 60 * 1000;

function digest(value) {
  return crypto.createHash('sha256').update(String(value)).digest('hex');
}

exports.loginWithPin = onCall({
  region: 'us-central1',
  secrets: [DRIVER_PIN],
  enforceAppCheck: false
}, async (request) => {
  const pin = String(request.data && request.data.pin || '');
  if (!/^\\d{4,8}$/.test(pin)) {
    throw new HttpsError('invalid-argument', 'Enter a 4–8 digit PIN.');
  }

  const ip = request.rawRequest && request.rawRequest.ip || 'unknown';
  const attemptRef = db.collection('pinAttempts').doc(digest(ip));
  const now = Date.now();
  const attemptState = await db.runTransaction(async (tx) => {
    const snap = await tx.get(attemptRef);
    const state = snap.exists ? snap.data() : {};
    const lockUntil = state.lockUntil && state.lockUntil.toMillis ? state.lockUntil.toMillis() : 0;
    if (lockUntil > now) return { locked: true, waitSeconds: Math.ceil((lockUntil - now) / 1000) };
    return { locked: false, count: Number(state.count || 0) };
  });
  if (attemptState.locked) {
    throw new HttpsError('resource-exhausted', 'Too many attempts. Try again later.');
  }

  const expected = DRIVER_PIN.value().trim();
  const matches = expected.length >= 4 && expected.length <= 8 && /^\\d+$/.test(expected) &&
    crypto.timingSafeEqual(Buffer.from(pin.padEnd(8, '0')), Buffer.from(expected.padEnd(8, '0'))) && pin.length === expected.length;

  if (!matches) {
    await db.runTransaction(async (tx) => {
      const snap = await tx.get(attemptRef);
      const state = snap.exists ? snap.data() : {};
      const count = Number(state.count || 0) + 1;
      const update = { count, updatedAt: FieldValue.serverTimestamp() };
      if (count >= MAX_ATTEMPTS) {
        update.count = 0;
        update.lockUntil = Timestamp.fromMillis(Date.now() + LOCK_MS);
      }
      tx.set(attemptRef, update, { merge: true });
    });
    throw new HttpsError('unauthenticated', 'Incorrect PIN.');
  }

  await attemptRef.delete().catch(() => {});
  const token = await getAuth().createCustomToken('warehouse-driver', { driver: true });
  return { token };
});
