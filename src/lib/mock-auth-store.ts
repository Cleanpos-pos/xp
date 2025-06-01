
// This is a mock in-memory store for staff credentials.
// In a real application, this would be replaced by a database.

export interface StaffCredentials {
  name: string;
  loginId: string;
  password: string;
}

// Extend the NodeJS.Global interface to declare our custom property
declare global {
  // eslint-disable-next-line no-var
  var staffMembersStore: StaffCredentials[] | undefined;
}

// Initialize with the default staff member for convenience during development,
// so there's always at least one user to log in with initially.
if (!global.staffMembersStore) {
  global.staffMembersStore = [
    { name: "Default Staff", loginId: "STAFF001", password: "password" }
  ];
}

export function addStaff(staff: StaffCredentials): void {
  if (!global.staffMembersStore) { // Should always be initialized by now
    global.staffMembersStore = [];
  }
  // Check if loginId already exists to prevent duplicates
  if (global.staffMembersStore.find(s => s.loginId === staff.loginId)) {
    console.warn(`Staff with loginId ${staff.loginId} already exists.`);
    // Optionally, you could throw an error or return a status here
    return;
  }
  global.staffMembersStore.push(staff);
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
