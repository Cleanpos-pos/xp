"use server";

import { createClient } from "@supabase/supabase-js";
import { revalidatePath } from "next/cache";

// This action should use the SERVICE_ROLE_KEY to perform administrative tasks
// like creating users and tenants. This key MUST be stored in environment variables
// and should NOT be prefixed with NEXT_PUBLIC_.
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
);

export async function registerBusinessAction(storeName: string, slug: string, email: string, password: string) {
  try {
    // 1. Validate inputs (basic server-side)
    if (!storeName || !slug || !email || !password) {
      return { success: false, message: "All fields are required." };
    }
    
    // 2. Check if slug is already taken in the tenants table
    const { data: existingTenant, error: slugError } = await supabaseAdmin
      .from('tenants')
      .select('slug')
      .eq('slug', slug)
      .maybeSingle();

    if (slugError) {
        console.error("Error checking slug:", slugError);
        return { success: false, message: "Could not validate store ID. Please try again." };
    }

    if (existingTenant) {
      return { success: false, message: "This Store URL ID is already taken. Please choose another." };
    }

    // 3. Create the user in Supabase Auth
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true, // Auto-confirm user for simplicity
      user_metadata: {
        full_name: storeName,
      }
    });

    if (authError || !authData.user) {
      console.error("Auth creation error:", authError);
      return { success: false, message: authError?.message || "Failed to create user account." };
    }

    const userId = authData.user.id;

    // 4. Create the tenant record and link it to the user
    // This should ideally be a transaction or a single RPC call.
    const { data: tenantData, error: tenantError } = await supabaseAdmin
      .from('tenants')
      .insert({
        name: storeName,
        slug: slug,
        owner_id: userId,
      })
      .select('id')
      .single();

    if (tenantError || !tenantData) {
      console.error("Tenant creation error:", tenantError);
      // Clean up the created user if tenant creation fails
      await supabaseAdmin.auth.admin.deleteUser(userId);
      return { success: false, message: "Failed to create the store record." };
    }

    const tenantId = tenantData.id;

    // 5. Update the user's app_metadata with the tenant_id
    const { error: metadataError } = await supabaseAdmin.auth.admin.updateUserById(
      userId,
      { app_metadata: { tenant_id: tenantId, role: 'admin' } } // Assign role here
    );

    if (metadataError) {
        console.error("User metadata update error:", metadataError);
        // If this fails, the user is created but not linked. This is a critical state.
        // Manual intervention would be needed. For now, we return an error.
        await supabaseAdmin.auth.admin.deleteUser(userId);
        await supabaseAdmin.from('tenants').delete().eq('id', tenantId);
        return { success: false, message: "Failed to link user to the new store." };
    }

    revalidatePath('/'); // Revalidate paths if needed
    return { success: true, message: "Store created successfully! You can now log in." };

  } catch (error: any) {
    console.error("Unexpected error in registerBusinessAction:", error);
    return { success: false, message: "An unexpected server error occurred." };
  }
}
