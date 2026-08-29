/**
 * orders.js
 * -----------------------------------------------------------------------
 * Handles placing new orders (customer) and loading order history with
 * live status badges.
 * -----------------------------------------------------------------------
 */

const STATUS_BADGE_CLASS = {
  Pending: "text-bg-warning",
  Preparing: "text-bg-info",
  Ready: "text-bg-success",
  Completed: "text-bg-secondary",
  Cancelled: "text-bg-danger",
};

/**
 * Places a new order in Supabase using the current cart contents.
 */
async function placeOrder(userId) {
  const cart = getCart();
  if (cart.length === 0) {
    showToast("Your cart is empty.", "error");
    return null;
  }

  const total = cartTotal();
  const itemsPayload = cart.map((c) => ({
    id: c.id,
    name: c.name,
    price: c.price,
    qty: c.qty,
  }));

  const { data, error } = await window.db
    .from("orders")
    .insert({
      user_id: userId,
      items: itemsPayload,
      total,
      status: "Pending",
    })
    .select()
    .single();

  if (error) {
    console.error(error);
    showToast("Could not place order. Please try again.", "error");
    return null;
  }

  clearCart();
  return data;
}

/**
 * Loads the logged-in user's own order history, most recent first.
 */
async function loadMyOrders(userId) {
  const container = document.getElementById("myOrdersContainer");
  if (!container) return;
  setLoading(container, true);

  const { data, error } = await window.db
    .from("orders")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (error) {
    console.error(error);
    container.innerHTML = `<p class="text-muted text-center py-4">Could not load your orders.</p>`;
    return;
  }

  if (!data || data.length === 0) {
    container.innerHTML = `
      <div class="text-center text-muted py-4">
        <i class="bi bi-receipt fs-1"></i>
        <p class="mt-2 mb-0">No orders yet. Place your first order from the menu!</p>
      </div>`;
    return;
  }

  container.innerHTML = data
    .map((order) => {
      const badgeClass = STATUS_BADGE_CLASS[order.status] || "text-bg-secondary";
      const itemsList = (order.items || [])
        .map((i) => `${i.qty}x ${escapeHTML(i.name)}`)
        .join(", ");
      const date = new Date(order.created_at).toLocaleString("en-PK", {
        dateStyle: "medium",
        timeStyle: "short",
      });

      return `
      <div class="card order-card mb-3">
        <div class="card-body">
          <div class="d-flex justify-content-between align-items-start flex-wrap gap-2">
            <div>
              <h6 class="mb-1">Order #${order.id.toString().slice(0, 8)}</h6>
              <small class="text-muted">${date}</small>
            </div>
            <span class="badge ${badgeClass} align-self-center">${order.status}</span>
          </div>
          <p class="mb-1 mt-2 small">${itemsList}</p>
          <p class="fw-bold mb-0">${formatPKR(order.total)}</p>
        </div>
      </div>`;
    })
    .join("");
}

/**
 * Subscribes to realtime updates on the orders table for a given user,
 * so status changes made by the admin appear instantly.
 */
function subscribeToMyOrders(userId) {
  window.db
    .channel("my-orders-" + userId)
    .on(
      "postgres_changes",
      {
        event: "*",
        schema: "public",
        table: "orders",
        filter: `user_id=eq.${userId}`,
      },
      () => loadMyOrders(userId)
    )
    .subscribe();
}
