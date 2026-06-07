import {
  collection,
  addDoc,
  getDocs,
  getDoc,
  doc,
  updateDoc,
  query,
  where,
  orderBy,
  limit,
  serverTimestamp,
  arrayUnion,
  increment,
  getCountFromServer,
} from 'firebase/firestore';
import { db } from '../config/firebase';

const INCIDENTS = 'incidents';
const USERS = 'users';
const VERIFICATIONS_NEEDED = 3;

// Severity → numeric score for spatial analytics
const SEVERITY_SCORE = { low: 1, medium: 2, high: 3, critical: 4 };

// ── Create ────────────────────────────────────────────────────────────────────

export async function createIncident({ type, description, photo_data, latitude, longitude, reporter_uid, reporter_name }) {
  const ref = await addDoc(collection(db, INCIDENTS), {
    type,
    description,
    // photo_data is a base64 data URL (compressed client-side, no Firebase Storage needed)
    photo_data: photo_data || null,
    latitude,
    longitude,
    status: 'pending',
    reporter_uid: reporter_uid || null,
    reporter_name: reporter_name || 'Anonymous',
    ml_label: null,
    ml_confidence: null,
    ml_severity: null,
    verification_count: 0,
    verifiers: [],
    created_at: serverTimestamp(),
    updated_at: serverTimestamp(),
  });
  return ref.id;
}

// ── Read ──────────────────────────────────────────────────────────────────────

export async function getIncidents({ status, type, limitCount = 200 } = {}) {
  // Avoid composite index: only use orderBy when there is no equality filter.
  // When filtering by status/type, sort client-side instead.
  const hasFilter = !!(status || type);
  const constraints = [];
  if (status) constraints.push(where('status', '==', status));
  if (type)   constraints.push(where('type', '==', type));
  if (!hasFilter) constraints.push(orderBy('created_at', 'desc'));
  constraints.push(limit(limitCount));

  const snap = await getDocs(query(collection(db, INCIDENTS), ...constraints));
  const docs = snap.docs.map(docToIncident);
  if (hasFilter) docs.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
  return docs;
}

export async function getIncidentById(id) {
  const snap = await getDoc(doc(db, INCIDENTS, id));
  return snap.exists() ? docToIncident(snap) : null;
}

export async function getUserIncidents(uid) {
  // No orderBy — avoids composite index requirement. Sort client-side instead.
  const snap = await getDocs(
    query(collection(db, INCIDENTS), where('reporter_uid', '==', uid))
  );
  const docs = snap.docs.map(docToIncident);
  docs.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
  return docs;
}

// ── Update ────────────────────────────────────────────────────────────────────

export async function updateIncidentStatus(id, status) {
  await updateDoc(doc(db, INCIDENTS, id), { status, updated_at: serverTimestamp() });
}

export async function updateIncidentML(id, { ml_label, ml_confidence, ml_severity }) {
  await updateDoc(doc(db, INCIDENTS, id), {
    ml_label,
    ml_confidence,
    ml_severity,
    status: 'classified',
    updated_at: serverTimestamp(),
  });
}

export async function verifyIncident(id, uid) {
  const ref = doc(db, INCIDENTS, id);
  const snap = await getDoc(ref);
  if (!snap.exists()) throw new Error('Incident not found');

  const data = snap.data();
  if (data.verifiers?.includes(uid)) throw new Error('Already verified');
  if (data.reporter_uid === uid) throw new Error('Cannot verify your own report');

  const newCount = (data.verification_count || 0) + 1;
  const updates = {
    verifiers: arrayUnion(uid),
    verification_count: increment(1),
    updated_at: serverTimestamp(),
  };
  if (newCount >= VERIFICATIONS_NEEDED && data.status === 'classified') {
    updates.status = 'verified';
  }
  await updateDoc(ref, updates);

  // Award 5 points to verifier
  await updateDoc(doc(db, USERS, uid), { points: increment(5) });
}

export async function awardReportPoints(uid) {
  if (!uid) return;
  await updateDoc(doc(db, USERS, uid), { points: increment(10) });
}

// ── Stats ─────────────────────────────────────────────────────────────────────

export async function getPlatformStats() {
  const col = collection(db, INCIDENTS);
  const [total, verified, resolved, today] = await Promise.all([
    getCountFromServer(col),
    getCountFromServer(query(col, where('status', '==', 'verified'))),
    getCountFromServer(query(col, where('status', '==', 'resolved'))),
    (async () => {
      const startOfDay = new Date();
      startOfDay.setHours(0, 0, 0, 0);
      // Firestore needs a Timestamp for comparison; use Date directly (SDK converts)
      const snap = await getDocs(query(col, where('created_at', '>=', startOfDay)));
      return snap.size;
    })(),
  ]);

  // Count distinct reporters
  const allSnap = await getDocs(query(col, limit(500)));
  const reporterSet = new Set(allSnap.docs.map((d) => d.data().reporter_uid).filter(Boolean));

  return {
    total_incidents: total.data().count,
    verified_incidents: verified.data().count,
    resolved_incidents: resolved.data().count,
    total_reporters: reporterSet.size,
    incidents_today: today,
  };
}

export async function getLeaderboard(limitCount = 20) {
  const snap = await getDocs(
    query(collection(db, USERS), orderBy('points', 'desc'), limit(limitCount))
  );
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
}

// ── Campaigns helpers ─────────────────────────────────────────────────────────

export async function getCampaigns({ status } = {}) {
  // When filtering by status, skip orderBy to avoid requiring a composite Firestore index.
  // Sort client-side instead.
  const q = status
    ? query(collection(db, 'campaigns'), where('status', '==', status))
    : query(collection(db, 'campaigns'), orderBy('created_at', 'desc'));
  const snap = await getDocs(q);
  const docs = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
  if (status) {
    docs.sort((a, b) => (b.created_at?.seconds ?? 0) - (a.created_at?.seconds ?? 0));
  }
  return docs;
}

export async function getNGOCampaigns(ngo_uid) {
  const snap = await getDocs(
    query(collection(db, 'campaigns'), where('ngo_uid', '==', ngo_uid), orderBy('created_at', 'desc'))
  );
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
}

export async function createCampaign(data) {
  const ref = await addDoc(collection(db, 'campaigns'), {
    ...data,
    volunteers: [],
    signup_count: 0,
    status: 'active',
    created_at: serverTimestamp(),
  });
  return ref.id;
}

export async function updateCampaign(id, updates) {
  await updateDoc(doc(db, 'campaigns', id), { ...updates, updated_at: serverTimestamp() });
}

export async function joinCampaign(id, uid) {
  const ref = doc(db, 'campaigns', id);
  const snap = await getDoc(ref);
  if (!snap.exists()) throw new Error('Campaign not found');
  if (snap.data().volunteers?.includes(uid)) throw new Error('Already joined');
  await updateDoc(ref, { volunteers: arrayUnion(uid), signup_count: increment(1) });
}

export async function leaveCampaign(id, uid) {
  const ref = doc(db, 'campaigns', id);
  const snap = await getDoc(ref);
  if (!snap.exists()) return;
  const volunteers = (snap.data().volunteers || []).filter((v) => v !== uid);
  await updateDoc(ref, { volunteers, signup_count: Math.max(0, (snap.data().signup_count || 1) - 1) });
}

export async function getUserCampaigns(uid) {
  const snap = await getDocs(
    query(collection(db, 'campaigns'), where('volunteers', 'array-contains', uid))
  );
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function isValidPhotoSrc(src) {
  return typeof src === 'string' &&
    (src.startsWith('data:') || src.startsWith('http://') || src.startsWith('https://'));
}

function docToIncident(snap) {
  const data = snap.data();
  // Prefer base64 data URL (current format) then fall back to a valid http URL.
  // Explicitly reject anything that is not a real URL (e.g. a Firebase UID string).
  const photo = isValidPhotoSrc(data.photo_data) ? data.photo_data
    : isValidPhotoSrc(data.photo_url) ? data.photo_url
    : null;
  return {
    id: snap.id,
    ...data,
    timestamp: data.created_at?.toDate?.() ?? new Date(),
    created_at: data.created_at?.toDate?.()?.toISOString() ?? new Date().toISOString(),
    updated_at: data.updated_at?.toDate?.()?.toISOString() ?? new Date().toISOString(),
    user_id: data.reporter_uid,
    latitude: data.latitude || 0,
    longitude: data.longitude || 0,
    photo_data: photo,
    photo_url: photo,
    status: data.status || 'pending',
    severity_score: SEVERITY_SCORE[data.ml_severity] || 1,
  };
}
