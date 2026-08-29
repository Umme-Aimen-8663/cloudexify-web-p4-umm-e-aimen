/**
 * admin.js
 * -----------------------------------------------------------------------
 * Powers admin.html: live stat cards, orders table with status updates,
 * and full menu management (add / edit / delete / toggle availability).
 * -----------------------------------------------------------------------
 */

let ADMIN_MENU_CACHE = [];

/* ---------------------------------------------------------------------
   STATS
--------------------------------------------------------------------- */

async function loadAdminStats() {
  const [{ data: orders, error: ordersErr }, { data: menuItems, error: menuErr }] =
    await Promise.all([
      window.db.from("orders").select("id,total,status,created_at"),
      window.db.from("menu_items").select("id"),
    ]);

  if (ordersErr || menuErr) {
    console.error(ordersErr || menuErr);
    showToast("Could not load dashboard stats.", "error");
    return;
  }

  const today = new Date().toDateString();
  const todaysOrders = (orders || []).filter(
    (o) => new Date(o.created_at).toDateString() === today
  );
  const revenueToday = todaysOrders.reduce((sum, o) => sum + Number(o.total || 0), 0);
  const pendingCount = (orders || []).filter((o) => o.status === "Pending").length;

  document.getElementById("statTotalOrders").textContent = todaysOrders.length;
  document.getElementById("statRevenue").textContent = formatPKR(revenueToday);
  document.getElementById("statPending").textContent = pendingCount;
  document.getElementById("statMenuItems").textContent = (menuItems || []).length;
}

/* ---------------------------------------------------------------------
   ORDERS TABLE
--------------------------------------------------------------------- */

async function loadAdminOrders() {
  const tbody = document.getElementById("ordersTableBody");
  if (!tbody) return;

  const { data: orders, error } = await window.db
    .from("orders")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    console.error(error);
    tbody.innerHTML = `<tr><td colspan="6" class="text-center text-muted py-4">Could not load orders.</td></tr>`;
    return;
  }

  if (!orders || orders.length === 0) {
    tbody.innerHTML = `<tr><td colspan="6" class="text-center text-muted py-4">No orders yet.</td></tr>`;
    return;
  }

  const userIds = [...new Set((orders || []).map((order) => order.user_id).filter(Boolean))];
  let customerLookup = {};

  if (userIds.length > 0) {
    const { data: profiles, error: profilesError } = await window.db
      .from("profiles")
      .select("id, full_name")
      .in("id", userIds);

    if (profilesError) {
      console.error(profilesError);
    } else {
      customerLookup = Object.fromEntries(
        (profiles || []).map((profile) => [profile.id, profile.full_name || "Guest"])
      );
    }
  }

  tbody.innerHTML = orders
    .map((order) => {
      const itemsSummary = (order.items || [])
        .map((i) => `${i.qty}x ${escapeHTML(i.name)}`)
        .join(", ");
      const customerName = customerLookup[order.user_id] || "Guest";
      const time = new Date(order.created_at).toLocaleString("en-PK", {
        dateStyle: "short",
        timeStyle: "short",
      });

      return `
      <tr>
        <td class="small text-muted">#${order.id.toString().slice(0, 8)}</td>
        <td>${escapeHTML(customerName)}</td>
        <td class="small">${itemsSummary}</td>
        <td class="fw-semibold">${formatPKR(order.total)}</td>
        <td class="small text-muted">${time}</td>
        <td>
          <select class="form-select form-select-sm status-select" data-order-id="${order.id}">
            ${["Pending", "Preparing", "Ready", "Completed", "Cancelled"]
              .map(
                (s) =>
                  `<option value="${s}" ${s === order.status ? "selected" : ""}>${s}</option>`
              )
              .join("")}
          </select>
        </td>
      </tr>`;
    })
    .join("");

  tbody.querySelectorAll(".status-select").forEach((select) => {
    select.addEventListener("change", async (e) => {
      const orderId = e.target.dataset.orderId;
      const newStatus = e.target.value;
      const { error: updateError } = await window.db
        .from("orders")
        .update({ status: newStatus })
        .eq("id", orderId);

      if (updateError) {
        showToast("Failed to update order status.", "error");
        console.error(updateError);
      } else {
        showToast(`Order updated to "${newStatus}"`, "success");
        loadAdminStats();
      }
    });
  });
}

/* ---------------------------------------------------------------------
   MENU MANAGEMENT
--------------------------------------------------------------------- */

async function ensureAdminAccess() {
  const {
    data: { user },
    error: userError,
  } = await window.db.auth.getUser();

  if (userError || !user) {
    showToast("Please sign in as an admin to manage menu items.", "error");
    setTimeout(() => (window.location.href = "login.html"), 700);
    return false;
  }

  const emailAdmin = isAdminEmail(user.email);
  let profile = await getProfile(user.id);

  if (emailAdmin && (!profile || profile.role !== "admin")) {
    await syncProfileRole(user, getUserDisplayName(user));
    profile = await getProfile(user.id);
  }

  if (!emailAdmin && (!profile || profile.role !== "admin")) {
    showToast("Admin access required to manage menu items.", "error");
    setTimeout(() => (window.location.href = "index.html"), 700);
    return false;
  }

  return true;
}

async function loadAdminMenu() {
  const tbody = document.getElementById("menuTableBody");
  if (!tbody) return;

  const isAdmin = await ensureAdminAccess();
  if (!isAdmin) return;

  const { data, error } = await window.db
    .from("menu_items")
    .select("*")
    .order("category", { ascending: true });

  if (error) {
    console.error(error);
    tbody.innerHTML = `<tr><td colspan="6" class="text-center text-muted py-4">Could not load menu.</td></tr>`;
    return;
  }

  ADMIN_MENU_CACHE = data || [];

  if (ADMIN_MENU_CACHE.length === 0) {
    tbody.innerHTML = `<tr><td colspan="6" class="text-center text-muted py-4">No menu items yet. Add one below.</td></tr>`;
    return;
  }

  tbody.innerHTML = ADMIN_MENU_CACHE
    .map(
      (item) => `
    <tr>
      <td>
        <img src="${escapeHTML(item.image_url || "")}" alt="" class="admin-menu-thumb" onerror="this.style.visibility='hidden'">
      </td>
      <td>${escapeHTML(item.name)}</td>
      <td>${escapeHTML(item.category)}</td>
      <td>${formatPKR(item.price)}</td>
      <td>
        <div class="form-check form-switch">
          <input class="form-check-input toggle-available" type="checkbox" data-id="${item.id}" ${
        item.available ? "checked" : ""
      }>
        </div>
      </td>
      <td class="text-nowrap">
        <button class="btn btn-sm btn-outline-secondary me-1" onclick="openEditItemModal('${item.id}')">
          <i class="bi bi-pencil"></i>
        </button>
        <button class="btn btn-sm btn-outline-danger" onclick="deleteMenuItem('${item.id}')">
          <i class="bi bi-trash"></i>
        </button>
      </td>
    </tr>`
    )
    .join("");

  tbody.querySelectorAll(".toggle-available").forEach((cb) => {
    cb.addEventListener("change", async (e) => {
      const itemId = e.target.dataset.id;
      const checked = Boolean(e.target.checked);

      const isAdmin = await ensureAdminAccess();
      if (!isAdmin) return;

      const { error: toggleError } = await window.db
        .from("menu_items")
        .update({ available: checked })
        .eq("id", itemId);

      if (toggleError) {
        console.error("Availability update failed:", toggleError);
        showToast("Failed to update availability. Check admin permissions.", "error");
        e.target.checked = !checked;
        return;
      }

      showToast("Availability updated.", "success");
      loadAdminStats();
      loadAdminMenu();
    });
  });
}

/**
 * Adds a new menu item from the "Add Item" form.
 */
async function addMenuItem(formData) {
  const isAdmin = await ensureAdminAccess();
  if (!isAdmin) return false;

  const { error } = await window.db.from("menu_items").insert({
    name: formData.name,
    description: formData.description,
    price: formData.price,
    category: formData.category,
    image_url: formData.image_url,
    available: true,
  });

  if (error) {
    console.error(error);
    showToast("Could not add menu item. Check your admin access.", "error");
    return false;
  }

  showToast(`"${formData.name}" added to menu.`, "success");
  loadAdminMenu();
  loadAdminStats();
  return true;
}

/**
 * Opens the edit modal pre-filled with the selected item's data.
 */
function openEditItemModal(itemId) {
  const item = ADMIN_MENU_CACHE.find((i) => i.id === itemId);
  if (!item) return;

  document.getElementById("editItemId").value = item.id;
  document.getElementById("editItemName").value = item.name;
  document.getElementById("editItemDescription").value = item.description || "";
  document.getElementById("editItemPrice").value = item.price;
  document.getElementById("editItemCategory").value = item.category;
  document.getElementById("editItemImage").value = item.image_url || "";

  const modal = new bootstrap.Modal(document.getElementById("editItemModal"));
  modal.show();
}

/**
 * Saves edits made in the edit modal.
 */
async function saveMenuItemEdit(formData) {
  const isAdmin = await ensureAdminAccess();
  if (!isAdmin) return false;

  const { error } = await window.db
    .from("menu_items")
    .update({
      name: formData.name,
      description: formData.description,
      price: formData.price,
      category: formData.category,
      image_url: formData.image_url,
    })
    .eq("id", formData.id);

  if (error) {
    console.error(error);
    showToast("Could not save changes. Check your admin access.", "error");
    return false;
  }

  showToast("Menu item updated.", "success");
  loadAdminMenu();
  return true;
}

/**
 * Deletes a menu item after confirmation.
 */
async function deleteMenuItem(itemId) {
  const item = ADMIN_MENU_CACHE.find((i) => i.id === itemId);
  if (!confirm(`Delete "${item?.name || "this item"}" from the menu?`)) return;

  const isAdmin = await ensureAdminAccess();
  if (!isAdmin) return;

  const { error } = await window.db.from("menu_items").delete().eq("id", itemId);
  if (error) {
    console.error(error);
    showToast("Could not delete item. Check your admin access.", "error");
    return;
  }

  showToast("Menu item deleted.", "success");
  loadAdminMenu();
  loadAdminStats();
}

/**
 * Sets up 30-second auto-refresh for the live stat cards + orders table.
 */
function startAdminAutoRefresh() {
  setInterval(() => {
    loadAdminStats();
    loadAdminOrders();
  }, 30000);
}
