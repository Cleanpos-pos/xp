
// This is a mock in-memory store for staff credentials.
// In a real application, this would be replaced by a database.

export interface StaffCredentials {
  name: string;
  loginId: string;
  password: string;
  enableQuickLogin?: boolean; // New field for quick login
}

// Extend the NodeJS.Global interface to declare our custom property
declare global {
  // eslint-disable-next-line no-var
  var staffMembersStore: StaffCredentials[] | undefined;
}

// Initialize with the default staff member
if (!global.staffMembersStore) {
  global.staffMembersStore = [
    { name: "Default Staff", loginId: "STAFF001", password: "password", enableQuickLogin: false }
  ];
}

// Type for adding new staff, matching AddStaffInput
type NewStaffMemberData = Pick<StaffCredentials, 'name' | 'loginId' | 'password'>;

export function addStaff(staffData: NewStaffMemberData): void {
  if (!global.staffMembersStore) {
    global.staffMembersStore = [];
  }
  if (global.staffMembersStore.find(s => s.loginId === staffData.loginId)) {
    console.warn(`Staff with loginId ${staffData.loginId} already exists.`);
    return;
  }
  const newStaffMember: StaffCredentials = {
    ...staffData,
    enableQuickLogin: false, // Default quick login to false for new staff
  };
  global.staffMembersStore.push(newStaffMember);
  console.log("Current staff members in mock store:", global.staffMembersStore);
}

export function findStaff(loginId: string, password?: string): StaffCredentials | undefined {
  if (!global.staffMembersStore) {
    return undefined;
  }
  const member = global.staffMembersStore.find(s => s.loginId === loginId);
  if (password) {
    return member && member.password === password ? member : undefined;
  }
  return member;
}

export function getAllStaff(): StaffCredentials[] {
  if (!global.staffMembersStore) {
    return [];
  }
  return [...global.staffMembersStore]; // Return a copy
}

export function updateStaffQuickLoginStatus(loginId: string, enable: boolean): boolean {
  if (!global.staffMembersStore) return false;
  const staffIndex = global.staffMembersStore.findIndex(s => s.loginId === loginId);
  if (staffIndex !== -1) {
    global.staffMembersStore[staffIndex].enableQuickLogin = enable;
    console.log("Updated quick login for:", global.staffMembersStore[staffIndex]);
    return true;
  }
  return false;
}

export function getQuickLoginStaff(): StaffCredentials[] {
  if (!global.staffMembersStore) return [];
  return global.staffMembersStore.filter(s => s.enableQuickLogin);
}
