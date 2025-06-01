
// NOTE ON PASSWORD SECURITY:
// In a real production application, passwords should NEVER be stored in plain text.
// They should be securely hashed using a strong algorithm (e.g., bcrypt or Argon2).
// For this prototype, we are storing them as plain text for simplicity.
// When integrating Supabase, we will handle password hashing properly.

export interface StaffCredentials {
  id?: string; // In a real DB, this would be the primary key
  name: string;
  loginId: string; // This will be our queryable unique ID for staff
  password: string; // Stored as plain text for prototype - HASH IN PRODUCTION!
  enableQuickLogin?: boolean;
}

// In-memory store for staff credentials (temporary, will be replaced by Supabase)
let mockStaffStore: StaffCredentials[] = [
  { id: 'staff1', name: 'Admin User', loginId: 'ADMIN001', password: 'password', enableQuickLogin: true },
  { id: 'staff2', name: 'Standard User', loginId: 'STAFF002', password: 'password123', enableQuickLogin: false },
];

export async function addStaff(staffData: Omit<StaffCredentials, 'id'>): Promise<StaffCredentials> {
  console.log("Mock addStaff called. Data will be in-memory until Supabase is integrated.", staffData);
  if (mockStaffStore.some(staff => staff.loginId === staffData.loginId)) {
    throw new Error(`Staff with loginId ${staffData.loginId} already exists.`);
  }
  const newStaff: StaffCredentials = {
    id: `mock-${Date.now()}`, // Simple mock ID
    ...staffData,
    enableQuickLogin: staffData.enableQuickLogin ?? false,
  };
  mockStaffStore.push(newStaff);
  return newStaff;
}

export async function findStaff(loginId: string, password?: string): Promise<StaffCredentials | undefined> {
  console.log(`Mock findStaff called for loginId: ${loginId}. Data is in-memory.`);
  const staffMember = mockStaffStore.find(staff => staff.loginId === loginId);

  if (!staffMember) {
    return undefined;
  }

  if (password && staffMember.password !== password) {
    return undefined;
  }
  return staffMember;
}

export async function getAllStaff(): Promise<StaffCredentials[]> {
  console.log("Mock getAllStaff called. Data is in-memory.");
  return [...mockStaffStore]; // Return a copy
}

export async function updateStaffQuickLoginStatus(loginId: string, enable: boolean): Promise<boolean> {
  console.log(`Mock updateStaffQuickLoginStatus called for ${loginId} to ${enable}. Data is in-memory.`);
  const staffMember = mockStaffStore.find(staff => staff.loginId === loginId);
  if (staffMember) {
    staffMember.enableQuickLogin = enable;
    return true;
  }
  console.warn(`No staff member found with loginId: ${loginId} to update quick login status.`);
  return false;
}

export async function getQuickLoginStaff(): Promise<StaffCredentials[]> {
  console.log("Mock getQuickLoginStaff called. Data is in-memory.");
  return mockStaffStore.filter(staff => staff.enableQuickLogin);
}
