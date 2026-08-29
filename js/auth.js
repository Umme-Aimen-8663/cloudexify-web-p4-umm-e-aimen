/**
 * auth.js
 * -----------------------------------------------------------------------
 * Handles registration, login, logout, session checks and role-based
 * route guarding for Desi Dine.
 * -----------------------------------------------------------------------
 */

/**
 * Known admin emails that should automatically get admin access.
 * Update this list to match your actual admin account(s).
 */
const ADMIN_EMAILS = [
  "admin@desidine.com",
  "admin@example.com",
  "ummeaimen.8663@gmail.com",
];

function isAdminEmail(email) {
  return ADMIN_EMAILS.includes((email || "").trim().toLowerCase());
}

function getUserDisplayName(user, fallbackName = "") {
  return (
    fallbackName ||
    user?.user_metadata?.full_name ||
    user?.app_metadata?.full_name ||
    (user?.email ? user.email.split("@")[0] : "User")
  );
}

async function syncProfileRole(user, fallbackName = "") {
  if (!user) return null;

  const desiredRole = isAdminEmail(user.email) ? "admin" : "customer";
  const existingProfile = await getProfile(user.id);

  const fullName =
    existingProfile?.full_name ||
    fallbackName ||
    user.user_metadata?.full_name ||
    (user.email ? user.email.split("@")[0] : "User");

  if (!existingProfile || existingProfile.role !== desiredRole) {
    const { error: upsertError } = await window.db
      .from("profiles")
      .upsert(
        {
          id: user.id,
          full_name: fullName,
          role: desiredRole,
        },
        { onConflict: "id" }
      );

    if (upsertError) {
      console.error("Profile role sync error:", upsertError);
    }
  }

  return getProfile(user.id);
}

/**
 * Registers a new user with Supabase Auth and creates their profile row.
 */
async function registerUser(fullName, email, password) {
  const { data, error } = await window.db.auth.signUp({
    email,
    password,
    options: {
      data: { full_name: fullName },
    },
  });

  if (error) throw error;

  if (data.user) {
    const role = isAdminEmail(email) ? "admin" : "customer";
    const { error: profileError } = await window.db.from("profiles").upsert(
      {
        id: data.user.id,
        full_name: fullName,
        role,
      },
      { onConflict: "id" }
    );

    if (profileError && profileError.code !== "23505") {
      console.error("Profile creation error:", profileError);
    }
  }

  return data;
}

/**
 * Logs a user in with email + password.
 */
async function loginUser(email, password) {
  const { data, error } = await window.db.auth.signInWithPassword({
    email,
    password,
  });
  if (error) throw error;

  if (data.user) {
    await syncProfileRole(data.user, data.user.email?.split("@")[0] || "User");
  }

  return data;
}

/**
 * Logs the current user out and redirects to login.
 */
async function logoutUser() {
  await window.db.auth.signOut();
  window.location.href = "login.html";
}

/**
 * Returns the currently logged-in Supabase user, or null.
 */
async function getCurrentUser() {
  const {
    data: { user },
  } = await window.db.auth.getUser();
  return user;
}

/**
 * Fetches the profile row (including role) for a given user id.
 */
async function getProfile(userId) {
  const { data, error } = await window.db
    .from("profiles")
    .select("*")
    .eq("id", userId)
    .single();
  if (error) {
    console.error("Error fetching profile:", error);
    return null;
  }
  return data;
}

/**
 * Guard for index.html / any customer page: redirects to login if not
 * authenticated. Returns { user, profile } on success.
 */
async function requireAuth() {
  const user = await getCurrentUser();
  if (!user) {
    window.location.href = "login.html";
    return null;
  }
  const profile = await getProfile(user.id);
  return { user, profile };
}

/**
 * Guard for admin.html: redirects to index.html if the logged-in user's
 * profile role is not 'admin'. Redirects to login.html if not logged in.
 */
async function requireAdmin() {
  const user = await getCurrentUser();
  if (!user) {
    window.location.href = "login.html";
    return null;
  }

  const emailAdmin = isAdminEmail(user.email);
  let profile = await getProfile(user.id);

  if (emailAdmin && (!profile || profile.role !== "admin")) {
    await syncProfileRole(user, getUserDisplayName(user));
    profile = await getProfile(user.id);
  }

  if (!emailAdmin && (!profile || profile.role !== "admin")) {
    showToast("Admin access only. Redirecting...", "error");
    setTimeout(() => (window.location.href = "index.html"), 1200);
    return null;
  }

  return { user, profile: profile || { id: user.id, role: "admin", full_name: getUserDisplayName(user) } };
}
