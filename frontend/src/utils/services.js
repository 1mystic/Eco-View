import { collection, getDocs, query, where, doc, getDoc } from 'firebase/firestore';
import { db } from '../config/firebase';
import {
  getIncidents,
  getLeaderboard as fsLeaderboard,
  getPlatformStats as fsPlatformStats,
  updateIncidentStatus as fsUpdateStatus,
  getIncidentById as fsGetById,
} from './firestoreIncidents';

// ── Incident helpers (thin wrappers used by existing pages) ───────────────────

export const getPendingReports   = () => getIncidents({ status: 'pending' });
export const getReportsByStatus  = (status) => getIncidents({ status });
export const getAllReports        = () => getIncidents();
export const getReportById       = (id) => fsGetById(id);
export const updateReportStatus  = (id, status) => fsUpdateStatus(id, status);
export const getLeaderboard      = () => fsLeaderboard(50);
export const getPlatformStats    = () => fsPlatformStats();

// ── Incident types ────────────────────────────────────────────────────────────

export const incidentTypes = [
  'Water Discharge',
  'Air Emission',
  'Waste Dumping',
  'Oil Spill',
  'Chemical Leak',
  'Noise Pollution',
  'Deforestation',
  'Illegal Mining',
  'Soil Contamination',
  'Other',
];

// ── NGO helpers (already Firestore, kept as-is) ───────────────────────────────

export const getNewNGOInvites = async () => {
  try {
    const usersRef = collection(db, 'users');
    const q = query(usersRef, where('approvalStatus', '==', 'pending'), where('role', '==', 'ngo'));
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
  } catch (error) {
    console.error('Error fetching NGO invites:', error);
    return [];
  }
};

export const getNGObyId = async (ngoId) => {
  try {
    const snap = await getDoc(doc(db, 'users', ngoId));
    return snap.exists() ? { id: snap.id, ...snap.data() } : null;
  } catch (error) {
    console.error('Error fetching NGO:', error);
    return null;
  }
};
