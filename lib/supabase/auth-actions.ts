import { createClient } from "../supabase/client";

export const logout = async () => {
  const supabase = createClient();
  await supabase.auth.signOut();
};

export const deleteAccount = async () => {
  const supabase = createClient();

  const confirmed = confirm(
    "Are you sure you want to delete your account? This action is irreversible."
  );
  if (!confirmed) return;

  const { error } = await supabase.rpc("delete_user");

  if (error) {
    alert("Error deleting account: " + error.message);
    return;
  }

  alert("Account deleted successfully!");
  await supabase.auth.signOut();
};
