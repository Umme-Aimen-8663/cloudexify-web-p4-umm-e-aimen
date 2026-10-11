/**
 * supabase.js
 * -----------------------------------------------------------------------
 * Central Supabase client initialization for Desi Dine.
 * Reads SUPABASE_URL and SUPABASE_ANON_KEY from a local `js/config.js`
 * file that defines `window.APP_CONFIG`.
 * -----------------------------------------------------------------------
 */

const appConfig = window.APP_CONFIG || {};
const SUPABASE_URL = appConfig.SUPABASE_URL;
const SUPABASE_ANON_KEY = appConfig.SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  throw new Error(
    "Missing Supabase config. Create js/config.js (gitignored) with window.APP_CONFIG.SUPABASE_URL and window.APP_CONFIG.SUPABASE_ANON_KEY."
  );
}

// The Supabase CDN script (loaded in every HTML page) exposes `supabase.createClient`
// as a global `supabase` object. We create our client and store it as `db`
// on the window so every other script file can access it without imports.
const { createClient } = supabase;
window.db = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

/**
 * Small helper to show a Bootstrap toast message.
 * Expects a <div id="toastContainer" class="toast-container ..."></div>
 * to exist somewhere in the page (added to every HTML file).
 */
function showToast(message, type = "success") {
  const container = document.getElementById("toastContainer");
  if (!container) {
    alert(message);
    return;
  }

  const id = "toast-" + Date.now();
  const bg =
    type === "success"
      ? "text-bg-success"
      : type === "error"
      ? "text-bg-danger"
      : "text-bg-warning";

  const toastHTML = `
    <div id="${id}" class="toast align-items-center ${bg} border-0" role="alert" aria-live="assertive" aria-atomic="true">
      <div class="d-flex">
        <div class="toast-body">${message}</div>
        <button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast" aria-label="Close"></button>
      </div>
    </div>`;

  container.insertAdjacentHTML("beforeend", toastHTML);
  const toastEl = document.getElementById(id);
  const toast = new bootstrap.Toast(toastEl, { delay: 3500 });
  toast.show();
  toastEl.addEventListener("hidden.bs.toast", () => toastEl.remove());
}

/**
 * Formats a number as Pakistani Rupees, e.g. 1250 -> "Rs. 1,250"
 */
function formatPKR(amount) {
  const num = Number(amount) || 0;
  return "Rs. " + num.toLocaleString("en-PK");
}

/** Basic HTML escaping to avoid rendering issues with special characters. */
function escapeHTML(str) {
  const div = document.createElement("div");
  div.textContent = str ?? "";
  return div.innerHTML;
}

/**
 * Simple loading spinner toggler.
 * Pass a DOM element and true/false.
 */
function setLoading(el, isLoading, loadingHTML = null) {
  if (!el) return;
  if (isLoading) {
    el.dataset.originalContent = el.innerHTML;
    el.innerHTML =
      loadingHTML ||
      `<div class="text-center py-5 w-100">
         <div class="spinner-border" style="color:var(--dd-green)" role="status">
           <span class="visually-hidden">Loading...</span>
         </div>
       </div>`;
  } else if (el.dataset.originalContent !== undefined) {
    el.innerHTML = el.dataset.originalContent;
    delete el.dataset.originalContent;
  }
}
