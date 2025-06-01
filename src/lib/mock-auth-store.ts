
import { db } from './firebase';
import { collection, addDoc, query, where, getDocs, doc, updateDoc, setDoc, getDoc } from 'firebase/firestore';

// NOTE ON PASSWORD SECURITY:
// In a real production application, passwords should NEVER be stored in plain text.
// They should be securely hashed using a strong algorithm (e.g., bcrypt or Argon2).
// For this prototype, we are storing them as plain text for simplicity.

export interface StaffCredentials {
  id?: string; // Firestore document ID, optional because it's not present before creation
  name: string;
  loginId: string; // This will be our queryable unique ID for staff
  password: string; // Stored as plain text for prototype - HASH IN PRODUCTION!
  enableQuickLogin?: boolean;
}

const STAFF_COLLECTION = "staff";

export async function addStaff(staffData: Omit<StaffCredentials, 'id'>): Promise<StaffCredentials> {
  // Check if loginId already exists
  const q = query(collection(db, STAFF_COLLECTION), where("loginId", "==", staffData.loginId));
  const querySnapshot = await getDocs(q);
  if (!querySnapshot.empty) {
    throw new Error(`Staff with loginId ${staffData.loginId} already exists.`);
  }

  const docRef = await addDoc(collection(db, STAFF_COLLECTION), {
    ...staffData,
    enableQuickLogin: staffData.enableQuickLogin ?? false, // Ensure it defaults to false
  });
  return { ...staffData, id: docRef.id, enableQuickLogin: staffData.enableQuickLogin ?? false };
}

export async function findStaff(loginId: string, password?: string): Promise<StaffCredentials | undefined> {
  const q = query(collection(db, STAFF_COLLECTION), where("loginId", "==", loginId));
  const querySnapshot = await getDocs(q);

  if (querySnapshot.empty) {
    return undefined;
  }

  const staffDoc = querySnapshot.docs[0];
  const staffData = staffDoc.data() as StaffCredentials;

  if (password) {
    if (staffData.password === password) {
      return { ...staffData, id: staffDoc.id };
    }
    return undefined;
  }
  return { ...staffData, id: staffDoc.id };
}

export async function getAllStaff(): Promise<StaffCredentials[]> {
  const querySnapshot = await getDocs(collection(db, STAFF_COLLECTION));
  return querySnapshot.docs.map(doc => ({ id: doc.id, ...(doc.data() as Omit<StaffCredentials, 'id'>) }));
}

export async function updateStaffQuickLoginStatus(loginId: string, enable: boolean): Promise<boolean> {
  const q = query(collection(db, STAFF_COLLECTION), where("loginId", "==", loginId));
  const querySnapshot = await getDocs(q);

  if (querySnapshot.empty) {
    console.warn(`No staff member found with loginId: ${loginId} to update quick login status.`);
    return false;
  }

  const staffDocRef = querySnapshot.docs[0].ref;
  await updateDoc(staffDocRef, {
    enableQuickLogin: enable
  });
  return true;
}

export async function getQuickLoginStaff(): Promise<StaffCredentials[]> {
  const q = query(collection(db, STAFF_COLLECTION), where("enableQuickLogin", "==", true));
  const querySnapshot = await getDocs(q);
  return querySnapshot.docs.map(doc => ({ id: doc.id, ...(doc.data() as Omit<StaffCredentials, 'id'>) }));
}
