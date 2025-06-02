
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
      updated_at: new Date().toISOString(),
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
  return {
    ...data,
    enable_quick_login: data.enable_quick_login ?? false,
    is_active: data.is_active ?? true, // Default to true if null, should be handled by DB default
  } as StaffCredentials;
}

export async function findStaff(login_id_input: string, password_input?: string): Promise<StaffCredentials | undefined> {
  const { data, error } = await supabase
    .from('staff')
    .select('*')
    .eq('login_id', login_id_input)
    .single();

  if (error && error.code !== 'PGRST116') { // PGRST116: "single row not found"
    console.error("Error finding staff in Supabase:", error);
    throw error;
  }

  if (!data) {
    return undefined;
  }

  const staffMember = {
    ...data,
    enable_quick_login: data.enable_quick_login ?? false,
    is_active: data.is_active ?? true, // Default to true if null, though DB default should prevent this
  } as StaffCredentials;


  // INSECURE: Plain text password comparison.
  if (password_input && staffMember.hashed_password !== password_input) {
    console.warn("SECURITY WARNING: Plain text password comparison.");
    return undefined;
  }
  // is_active check is handled in loginAction
  return staffMember;
}

export async function getAllStaff(): Promise<StaffCredentials[]> {
  const { data, error } = await supabase
    .from('staff')
    .select('*');

  if (error) {
    console.error("Error fetching all staff from Supabase:", error);
    throw error;
  }
  return ((data || []) as StaffCredentials[]).map(s => ({
      ...s,
      enable_quick_login: s.enable_quick_login ?? false, 
      is_active: s.is_active ?? true 
  }));
}

export async function updateStaffQuickLoginStatus(login_id_input: string, enable: boolean): Promise<boolean> {
  console.log(`[updateStaffQuickLoginStatus] Attempting to update login_id: '${login_id_input}' (type: ${typeof login_id_input}) to enable_quick_login: ${enable}`);
  
  const { data: selectData, error: selectError } = await supabase
    .from('staff')
    .select('id, login_id, name, enable_quick_login, is_active')
    .eq('login_id', login_id_input)
    .maybeSingle();

  if (selectError) {
    console.error(`[updateStaffQuickLoginStatus] PRE-UPDATE SELECT FAILED for login_id '${login_id_input}'. Error:`, selectError);
    return false;
  }
  if (!selectData) {
    console.warn(`[updateStaffQuickLoginStatus] PRE-UPDATE SELECT DID NOT FIND login_id '${login_id_input}'.`);
    return false;
  }
  console.log(`[updateStaffQuickLoginStatus] PRE-UPDATE SELECT SUCCEEDED for login_id '${login_id_input}'. Found:`, selectData);

  // If current state is same as target state, no update needed, return true (idempotent)
  if (selectData.enable_quick_login === enable) {
    console.log(`[updateStaffQuickLoginStatus] No update needed for '${login_id_input}', enable_quick_login is already ${enable}.`);
    return true;
  }

  const { data: updateData, error: updateError } = await supabase
    .from('staff')
    .update({ enable_quick_login: enable, updated_at: new Date().toISOString() }) 
    .eq('login_id', login_id_input)
    .select('id'); // Select 'id' to confirm update

  if (updateError) {
    console.error(`[updateStaffQuickLoginStatus] Error updating quick login for '${login_id_input}':`, updateError);
    throw updateError;
  }
  
  const success = updateData !== null && updateData.length > 0;
  console.log(`[updateStaffQuickLoginStatus] Update for '${login_id_input}' ${success ? 'succeeded' : 'did not affect any rows (check RLS or if data was already set to target value)'}. Returned data length: ${updateData?.length}`);
  return success;
}

export async function updateStaffActiveStatus(login_id_input: string, is_active: boolean): Promise<boolean> {
  console.log(`[updateStaffActiveStatus] Attempting to update login_id: '${login_id_input}' (type: ${typeof login_id_input}) to is_active: ${is_active}`);
  
  const { data: selectData, error: selectError } = await supabase
    .from('staff')
    .select('id, login_id, name, enable_quick_login, is_active')
    .eq('login_id', login_id_input)
    .maybeSingle();

  if (selectError) {
    console.error(`[updateStaffActiveStatus] PRE-UPDATE SELECT FAILED for login_id '${login_id_input}'. Error:`, selectError);
    return false;
  }
  if (!selectData) {
    console.warn(`[updateStaffActiveStatus] PRE-UPDATE SELECT DID NOT FIND login_id '${login_id_input}'.`);
    return false;
  }
  console.log(`[updateStaffActiveStatus] PRE-UPDATE SELECT SUCCEEDED for login_id '${login_id_input}'. Found:`, selectData);

  // If current state is same as target state, no update needed, return true (idempotent)
  if (selectData.is_active === is_active) {
    console.log(`[updateStaffActiveStatus] No update needed for '${login_id_input}', is_active is already ${is_active}.`);
    return true;
  }

  const { data: updateData, error: updateError } = await supabase
    .from('staff')
    .update({ is_active: is_active, updated_at: new Date().toISOString() })
    .eq('login_id', login_id_input)
    .select('id'); // Select 'id' to confirm update

  if (updateError) {
    console.error(`[updateStaffActiveStatus] Error updating active status for '${login_id_input}':`, updateError);
    throw updateError;
  }

  const success = updateData !== null && updateData.length > 0;
  console.log(`[updateStaffActiveStatus] Update for '${login_id_input}' ${success ? 'succeeded' : 'did not affect any rows (check RLS or if data was already set to target value)'}. Returned data length: ${updateData?.length}`);
  return success;
}


export async function getQuickLoginStaff(): Promise<StaffCredentials[]> {
  console.log("[getQuickLoginStaff] Fetching users with enable_quick_login=true AND is_active=true.");
  const { data, error, count } = await supabase
    .from('staff')
    .select('*', { count: 'exact' }) // Request count
    .eq('enable_quick_login', true)
    .eq('is_active', true);

  if (error) {
    console.error("[getQuickLoginStaff] Error fetching quick login staff from Supabase:", error);
    throw error;
  }

  console.log(`[getQuickLoginStaff] Supabase returned ${count} record(s). Raw data:`, data);

  const mappedData = ((data || []) as StaffCredentials[]).map(s => ({
      ...s,
      enable_quick_login: s.enable_quick_login ?? false,
      is_active: s.is_active ?? true,
  }));

  console.log("[getQuickLoginStaff] Mapped data being returned:", mappedData);
  return mappedData;
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
