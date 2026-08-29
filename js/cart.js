/**
 * cart.js
 * -----------------------------------------------------------------------
 * Manages the shopping cart: add/remove/update quantity, running total,
 * and persistence in sessionStorage so the cart survives page refreshes
 * (but clears when the browser tab/session ends).
 * -----------------------------------------------------------------------
 */

const CART_KEY = "desidine_cart";

function getCart() {
  try {
    return JSON.parse(sessionStorage.getItem(CART_KEY)) || [];
  } catch {
    return [];
  }
}

function saveCart(cart) {
  sessionStorage.setItem(CART_KEY, JSON.stringify(cart));
  updateCartBadge();
}

function addToCart(menuItemId) {
  const item = ALL_MENU_ITEMS.find((i) => i.id === menuItemId);
  if (!item) return;

  const cart = getCart();
  const existing = cart.find((c) => c.id === item.id);

  if (existing) {
    existing.qty += 1;
  } else {
    cart.push({
      id: item.id,
      name: item.name,
      price: item.price,
      qty: 1,
    });
  }

  saveCart(cart);
  renderCart();                 // ← This line was missing
  showToast(`${item.name} added to cart`, "success");
}

function updateCartQty(itemId, delta) {
  let cart = getCart();
  const line = cart.find((c) => c.id === itemId);
  if (!line) return;

  line.qty += delta;
  if (line.qty <= 0) {
    cart = cart.filter((c) => c.id !== itemId);
  }
  saveCart(cart);
  renderCart();
}

function removeFromCart(itemId) {
  const cart = getCart().filter((c) => c.id !== itemId);
  saveCart(cart);
  renderCart();
}

function clearCart() {
  saveCart([]);
  renderCart();
}

function cartTotal() {
  return getCart().reduce((sum, c) => sum + c.price * c.qty, 0);
}

function cartItemCount() {
  return getCart().reduce((sum, c) => sum + c.qty, 0);
}

function updateCartBadge() {
  const badge = document.getElementById("cartBadge");
  if (badge) {
    const count = cartItemCount();
    badge.textContent = count;
    badge.classList.toggle("d-none", count === 0);
  }
}

/**
 * Renders the cart contents inside the offcanvas cart panel.
 */
function renderCart() {
  const container = document.getElementById("cartItemsContainer");
  const totalEl = document.getElementById("cartTotal");
  if (!container) return;

  const cart = getCart();

  if (cart.length === 0) {
    container.innerHTML = `
      <div class="text-center text-muted py-5">
        <i class="bi bi-cart-x fs-1"></i>
        <p class="mt-2 mb-0">Your cart is empty.</p>
      </div>`;
  } else {
    container.innerHTML = cart
      .map(
        (c) => `
      <div class="d-flex align-items-center justify-content-between border-bottom py-2">
        <div>
          <div class="fw-semibold">${escapeHTML(c.name)}</div>
          <small class="text-muted">${formatPKR(c.price)} each</small>
        </div>
        <div class="d-flex align-items-center gap-2">
          <button class="btn btn-sm btn-outline-secondary" onclick="updateCartQty('${c.id}', -1)">-</button>
          <span>${c.qty}</span>
          <button class="btn btn-sm btn-outline-secondary" onclick="updateCartQty('${c.id}', 1)">+</button>
          <button class="btn btn-sm btn-link text-danger" onclick="removeFromCart('${c.id}')">
            <i class="bi bi-trash"></i>
          </button>
        </div>
      </div>`
      )
      .join("");
  }

  if (totalEl) totalEl.textContent = formatPKR(cartTotal());
  updateCartBadge();
}
// Update cart UI every time the cart offcanvas is opened
document.addEventListener("DOMContentLoaded", () => {
  const cartOffcanvas = document.getElementById("cartOffcanvas");
  if (cartOffcanvas) {
    cartOffcanvas.addEventListener("show.bs.offcanvas", () => {
      renderCart();
    });
  }
});