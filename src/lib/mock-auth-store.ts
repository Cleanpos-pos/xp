
// This is a mock in-memory store for staff credentials.
// In a real application, this would be replaced by a database.

export interface StaffCredentials {
  name: string;
  loginId: string;
  password: string;
}

// Initialize with the default staff member for convenience during development,
// so there's always at least one user to log in with initially.
export const staffMembers: StaffCredentials[] = [
  { name: "Default Staff", loginId: "STAFF001", password: "password" }
];

export function addStaff(staff: StaffCredentials): void {
  // Check if loginId already exists to prevent duplicates
  if (staffMembers.find(s => s.loginId === staff.loginId)) {
    console.warn(`Staff with loginId ${staff.loginId} already exists.`);
    // Optionally, you could throw an error or return a status here
    return;
  }
  staffMembers.push(staff);
  console.log("Current staff members in mock store:", staffMembers);
}

export function findStaff(loginId: string, password?: string): StaffCredentials | undefined {
  const member = staffMembers.find(s => s.loginId === loginId);
  if (password) {
    return member && member.password === password ? member : undefined;
  }
  return member;
}
