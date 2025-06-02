
import { supabase } from './supabase';
import type { UserRole, StaffCredentials } from '@/types'; // Import StaffCredentials from types

// NOTE ON PASSWORD SECURITY:
// In a real production application, passwords should NEVER be stored in plain text.
// They should be securely hashed using a strong algorithm (e.g., bcrypt or Argon2).
// The `hashed_password` column in Supabase should store these hashes.
// FOR THIS PROTOTYPE, we are storing plain text in the `hashed_password` column for simplicity.
// THIS IS INSECURE AND MUST BE CHANGED FOR PRODUCTION.


export async function addStaff(staffData: Omit<StaffCredentials, 'id' | 'created_at' | 'updated_at' | 'hashed_password' | 'is_active'> & { password: string }): Promise<StaffCredentials> {
  console.warn("SECURITY WARNING: Storing plain text password in 'hashed_password' column. Implement proper hashing for production.");

  const { error, data } = await supabase
    .from('staff')
    .insert({
      name: staffData.name,
      login_id: staffData.login_id,
      hashed_password: staffData.password, // Storing plain text password directly!
      enable_quick_login: staffData.enable_quick_login ?? false,
      role: staffData.role ?? 'clerk',
      is_active: true, // New staff are active by default
    })
    .select()
    .single();

  if (error) {
    console.error("Error adding staff to Supabase:", error);
    if (error.code === '23505') { // Unique constraint violation for login_id
        throw new Error(`Staff with login ID ${staffData.login_id} already exists.`);
    }
    throw error;
  }
  return data as StaffCredentials;
}

export async function findStaff(login_id_input: string, password_input?: string): Promise<StaffCredentials | undefined> {
  const { data, error } = await supabase
    .from('staff')
    .select('*, role, is_active') // Ensure role and is_active are selected
    .eq('login_id', login_id_input)
    .single();

  if (error && error.code !== 'PGRST116') { // PGRST116: "single row not found"
    console.error("Error finding staff in Supabase:", error);
    throw error;
  }

  if (!data) {
    return undefined;
  }

  const staffMember = data as StaffCredentials;

  // INSECURE: Plain text password comparison.
  if (password_input && staffMember.hashed_password !== password_input) {
    console.warn("SECURITY WARNING: Plain text password comparison.");
    return undefined;
  }
  // Do not return staffMember if not active, login action will handle message
  // if (staffMember.is_active === false) {
  //   return undefined; // Or throw a specific error/status
  // }
  return staffMember;
}

export async function getAllStaff(): Promise<StaffCredentials[]> {
  const { data, error } = await supabase
    .from('staff')
    .select('*, role, is_active'); // Ensure role and is_active are selected

  if (error) {
    console.error("Error fetching all staff from Supabase:", error);
    throw error;
  }
  return ((data || []) as StaffCredentials[]).map(s => ({
      ...s,
      is_active: s.is_active ?? true // Default to true if null in DB (should not happen with DEFAULT TRUE)
  }));
}

export async function updateStaffQuickLoginStatus(login_id_input: string, enable: boolean): Promise<boolean> {
  const { error, count } = await supabase
    .from('staff')
    .update({ enable_quick_login: enable })
    .eq('login_id', login_id_input);

  if (error) {
    console.error("Error updating quick login status in Supabase:", error);
    throw error;
  }
  return count !== null && count > 0;
}

export async function updateStaffActiveStatus(login_id_input: string, is_active: boolean): Promise<boolean> {
  const { error, count } = await supabase
    .from('staff')
    .update({ is_active: is_active })
    .eq('login_id', login_id_input);

  if (error) {
    console.error("Error updating staff active status in Supabase:", error);
    throw error;
  }
  return count !== null && count > 0;
}


export async function getQuickLoginStaff(): Promise<StaffCredentials[]> {
  const { data, error } = await supabase
    .from('staff')
    .select('*, role, is_active') // Ensure role and is_active are selected
    .eq('enable_quick_login', true)
    .eq('is_active', true); // Only fetch active staff for quick login

  if (error) {
    console.error("Error fetching quick login staff from Supabase:", error);
    throw error;
  }
  return ((data || []) as StaffCredentials[]).map(s => ({
      ...s,
      is_active: s.is_active ?? true
  }));
}

export async function deleteStaff(login_id_input: string): Promise<boolean> {
  const { error, count } = await supabase
    .from('staff')
    .delete()
    .eq('login_id', login_id_input);

  if (error) {
    console.error("Error deleting staff from Supabase:", error);
    throw error;
  }
  return count !== null && count > 0;
}
