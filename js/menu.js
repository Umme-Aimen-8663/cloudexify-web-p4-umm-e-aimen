/**
 * menu.js
 * -----------------------------------------------------------------------
 * Fetches menu items from Supabase and renders the menu grid on
 * index.html, including category filtering and live search.
 * -----------------------------------------------------------------------
 */

let ALL_MENU_ITEMS = [];
let ACTIVE_CATEGORY = "All";

const CATEGORY_ICONS = {
  Pakistani: "bi-egg-fried",
  "Chinese Specials": "bi-emoji-smile",
  "Italian Specials": "bi-flower1",
  "Fast Food": "bi-lightning-charge",
  "Desserts & Drinks": "bi-cup-straw",
};

/**
 * Loads all *available* menu items from Supabase, ordered by category.
 */
async function loadMenuItems() {
  const grid = document.getElementById("menuGrid");
  setLoading(grid, true);

  const { data, error } = await window.db
    .from("menu_items")
    .select("*")
    .eq("available", true)
    .order("category", { ascending: true })
    .order("name", { ascending: true });

  if (error) {
    console.error(error);
    showToast("Could not load the menu. Please refresh.", "error");
    grid.innerHTML = `<p class="text-center text-muted py-5">Menu unavailable right now.</p>`;
    return;
  }

  ALL_MENU_ITEMS = data || [];
  renderMenu();
}

/**
 * Renders the menu grid based on ACTIVE_CATEGORY and the search box value.
 */
function renderMenu() {
  const grid = document.getElementById("menuGrid");
  const searchTerm = (document.getElementById("menuSearch")?.value || "")
    .trim()
    .toLowerCase();

  let items = ALL_MENU_ITEMS;

  if (ACTIVE_CATEGORY !== "All") {
    items = items.filter((i) => i.category === ACTIVE_CATEGORY);
  }

  if (searchTerm) {
    items = items.filter(
      (i) =>
        i.name.toLowerCase().includes(searchTerm) ||
        (i.description || "").toLowerCase().includes(searchTerm)
    );
  }

  if (items.length === 0) {
    grid.innerHTML = `
      <div class="col-12 text-center py-5">
        <i class="bi bi-search fs-1 text-muted"></i>
        <p class="text-muted mt-2 mb-0">No dishes found. Try a different search or category.</p>
      </div>`;
    return;
  }

  grid.innerHTML = items
    .map((item) => {
      const imageUrl = getMenuImageUrl(item);
      return `
    <div class="col-md-6 col-lg-4">
      <div class="card menu-card h-100">
        <div class="menu-card-img" style="background-image:url('${escapeHTML(imageUrl)}')">
          <span class="badge menu-category-badge">${escapeHTML(item.category)}</span>
        </div>
        <div class="card-body d-flex flex-column">
          <h5 class="card-title mb-1">${escapeHTML(item.name)}</h5>
          <p class="card-text text-muted small flex-grow-1">${escapeHTML(
            item.description || ""
          )}</p>
          <div class="d-flex align-items-center justify-content-between mt-2">
            <span class="fw-bold menu-price">${formatPKR(item.price)}</span>
            <button class="btn btn-sm btn-dd-primary" onclick="addToCart('${item.id}')">
              <i class="bi bi-plus-lg"></i> Add
            </button>
          </div>
        </div>
      </div>
    </div>`;
    })
    .join("");
}

/**
 * Wires up category filter buttons and the search input.
 */
function initMenuControls() {
  document.querySelectorAll(".category-filter-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      document
        .querySelectorAll(".category-filter-btn")
        .forEach((b) => b.classList.remove("active"));
      btn.classList.add("active");
      ACTIVE_CATEGORY = btn.dataset.category;
      renderMenu();
    });
  });

  const searchInput = document.getElementById("menuSearch");
  if (searchInput) {
    searchInput.addEventListener("input", () => renderMenu());
  }
}

/** Basic HTML escaping to avoid rendering issues with special characters. */
function escapeHTML(str) {
  const div = document.createElement("div");
  div.textContent = str ?? "";
  return div.innerHTML;
}

function getMenuImageUrl(item) {
  const fallback =
    "https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=900&q=80";

  const raw = item?.image_url || item?.image || "";
  if (raw) {
    const cleaned = String(raw).trim();
    try {
      const url = new URL(cleaned);
      if (url.protocol === "http:" || url.protocol === "https:") return cleaned;
    } catch (_err) {
      // ignore invalid URLs and use curated matches below
    }
  }

  const name = (item?.name || "").trim();
  const category = (item?.category || "").trim().toLowerCase();
  const normalized = name
    .toLowerCase()
    .replace(/\s*\([^)]*\)/g, "")
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  const catalogs = {
    "chicken biryani": "https://images.unsplash.com/photo-1631515243349-e0cb75fb8d3a?w=600&q=80",
    "mutton karahi": "https://images.unsplash.com/photo-1585937421612-70a008356fbe?w=600&q=80",
    "nihari": "https://images.unsplash.com/photo-1631452180519-c014fe946bc7?w=600&q=80",
    "haleem": "https://images.unsplash.com/photo-1626132647523-66f5bf380027?w=600&q=80",
    "seekh kebab": "https://images.unsplash.com/photo-1544025162-d76694265947?w=600&q=80",
    "chapli kebab": "https://images.unsplash.com/photo-1599487488170-d11ec9c172f0?w=600&q=80",
    "chicken pulao": "https://images.unsplash.com/photo-1596797038530-2c107229654b?w=600&q=80",
    "daal chawal": "https://images.unsplash.com/photo-1546833999-b9f581a1996d?w=600&q=80",
    "tandoori roti": "https://images.unsplash.com/photo-1565557623262-b51c2513a641?w=600&q=80",
    "butter naan": "https://images.unsplash.com/photo-1601050690597-df0568f70950?w=600&q=80",
    "chicken manchurian": "https://images.unsplash.com/photo-1585032226651-759b368d7246?w=600&q=80",
    "vegetable fried rice": "https://images.unsplash.com/photo-1512058564366-18510be2db19?w=600&q=80",
    "chicken chowmein": "https://images.unsplash.com/photo-1569718212165-3a9b5bb0f46b?w=600&q=80",
    "margherita pizza": "https://images.unsplash.com/photo-1574071318508-1cdbab80d002?w=600&q=80",
    "chicken alfredo pasta": "https://images.unsplash.com/photo-1645112411341-6c4fd023714a?w=600&q=80",
    "beef zinger burger": "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=600&q=80",
    "loaded fries": "https://images.unsplash.com/photo-1573080496219-bb080dd4f877?w=600&q=80",
    "chicken shawarma roll": "https://images.unsplash.com/photo-1633436375153-d7045cb93e38?w=600&q=80",
    "lassi sweet": "https://images.unsplash.com/photo-1626200945225-c988fa72bfe4?w=600&q=80",
    "lassi": "https://images.unsplash.com/photo-1626200945225-c988fa72bfe4?w=600&q=80",
    "gulab jamun": "https://images.unsplash.com/photo-1601303516361-b1a5f6a1b52d?w=600&q=80",
  };

  const byName = catalogs[normalized] || catalogs[name.toLowerCase()];
  if (byName) return byName;

  if (category.includes("pakistani")) return "https://images.unsplash.com/photo-1544025162-d76694265947?w=600&q=80";
  if (category.includes("chinese")) return "https://images.unsplash.com/photo-1512058564366-18510be2db19?w=600&q=80";
  if (category.includes("italian")) return "https://images.unsplash.com/photo-1574071318508-1cdbab80d002?w=600&q=80";
  if (category.includes("fast")) return "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=600&q=80";
  if (category.includes("drink") || category.includes("dessert")) return "https://images.unsplash.com/photo-1626200945225-c988fa72bfe4?w=600&q=80";

  return fallback;
}
