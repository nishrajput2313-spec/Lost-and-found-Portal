// ---------------------------------------------------------------
// Browse page logic — fetches items from the Express + MongoDB API.
// ---------------------------------------------------------------

const state = { query: "", filter: "all", items: [] };

function timeAgo(dateStr) {
  const days = Math.max(0, Math.round((Date.now() - new Date(dateStr)) / 86400000));
  if (days === 0) return "Today";
  if (days === 1) return "Yesterday";
  return `${days}d ago`;
}

function itemCardHTML(item) {
  return `
    <a class="ticket" href="item-detail.html?id=${item._id}">
      <div class="ticket-image">
        ${item.imageUrl ? `<img src="${API_BASE.replace("/api", "")}${item.imageUrl}" alt="${item.title}" style="width:100%;height:100%;object-fit:cover;" />` : ""}
        <span class="tag-badge ${item.type}">${item.type}</span>
        ${item.imageUrl ? "" : "<span>Photo</span>"}
      </div>
      <div class="ticket-body">
        <h3>${item.title}</h3>
        <div class="ticket-meta">
          <span>${item.category}</span>
          <span class="dot"></span>
          <span>${item.location}</span>
        </div>
      </div>
      <div class="ticket-stub">
        <span class="status-pill ${item.status}">${item.status}</span>
        <span>${timeAgo(item.date)}</span>
      </div>
    </a>
  `;
}

function render() {
  const grid = document.getElementById("item-grid");
  const emptyState = document.getElementById("empty-state");
  const countEl = document.getElementById("result-count");
  if (!grid) return;

  const filtered = state.items.filter((item) => {
    const matchesFilter = state.filter === "all" || item.type === state.filter;
    const q = state.query.trim().toLowerCase();
    const matchesQuery =
      !q ||
      item.title.toLowerCase().includes(q) ||
      item.category.toLowerCase().includes(q) ||
      item.location.toLowerCase().includes(q);
    return matchesFilter && matchesQuery;
  });

  grid.innerHTML = filtered.map(itemCardHTML).join("");
  if (countEl) countEl.textContent = `${filtered.length} item${filtered.length === 1 ? "" : "s"}`;
  if (emptyState) emptyState.style.display = filtered.length ? "none" : "block";
}

async function loadItems() {
  const grid = document.getElementById("item-grid");
  if (!grid) return;
  grid.innerHTML = `<p style="color:var(--text-soft); grid-column:1/-1;">Loading items…</p>`;

  try {
    state.items = await apiFetch("/items");
    render();
  } catch (err) {
    grid.innerHTML = `<p style="color:var(--rust); grid-column:1/-1;">Couldn't load items — is the backend running? (${err.message})</p>`;
  }
}

async function loadStats() {
  const postedEl = document.getElementById("stat-posted");
  if (!postedEl) return;
  try {
    const stats = await apiFetch("/items/stats");
    postedEl.textContent = stats.totalPosted;
    document.getElementById("stat-reunited").textContent = stats.reunited;
    document.getElementById("stat-avg").textContent =
      stats.avgResolveDays !== null ? `${stats.avgResolveDays} days` : "—";
  } catch (err) {
    // Stats are a nice-to-have; fail silently if the backend is unreachable.
  }
}

document.addEventListener("DOMContentLoaded", () => {
  const grid = document.getElementById("item-grid");
  if (!grid) return; // not the browse page

  const searchInput = document.getElementById("search-input");
  const chips = document.querySelectorAll(".chip");

  searchInput?.addEventListener("input", (e) => {
    state.query = e.target.value;
    render();
  });

  chips.forEach((chip) => {
    chip.addEventListener("click", () => {
      chips.forEach((c) => c.classList.remove("active"));
      chip.classList.add("active");
      state.filter = chip.dataset.filter;
      render();
    });
  });

  loadItems();
  loadStats();
});
