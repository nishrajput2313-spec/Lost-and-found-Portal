const CATEGORY_LABELS = {
  Electronics: "Electronics",
  Bags: "Bags",
  "ID Card": "ID Card",
  Accessories: "Accessories",
  "Books & Notes": "Books & Notes",
  "Personal Items": "Personal Items",
  Other: "Other",
};

function breakdownHTML(rows, total) {
  if (!rows.length) return `<p style="color:var(--text-soft); font-size:13px;">No data yet.</p>`;
  const max = Math.max(...rows.map((r) => r.count), 1);
  return rows
    .map(
      (r) => `
      <div class="breakdown-row">
        <span class="breakdown-label">${r.status || r.category}</span>
        <div class="breakdown-bar"><span style="width:${(r.count / max) * 100}%"></span></div>
        <span class="breakdown-count">${r.count}</span>
      </div>`
    )
    .join("");
}

function adminRowHTML(item) {
  const statusOptions = ["posted", "claimed", "resolved", "inactive"]
    .map((s) => `<option value="${s}" ${s === item.status ? "selected" : ""}>${s}</option>`)
    .join("");

  return `
    <tr data-item-id="${item._id}">
      <td><a href="item-detail.html?id=${item._id}" style="font-weight:600;">${item.title}</a></td>
      <td><span class="tag-badge ${item.type}" style="position:static;">${item.type}</span></td>
      <td>${item.category}</td>
      <td>${item.location}</td>
      <td>${item.postedBy?.name || "—"}</td>
      <td><select class="status-select">${statusOptions}</select></td>
      <td><button class="admin-del-btn" data-action="delete">Delete</button></td>
    </tr>`;
}

async function loadAdmin() {
  const guard = document.getElementById("admin-guard");
  const content = document.getElementById("admin-content");
  const user = getUser();

  if (!getToken() || !user) {
    guard.innerHTML = `<p style="color:var(--text-soft);">Please <a href="login.html" style="color:var(--amber-deep); font-weight:600;">log in</a> with a staff account to view this page.</p>`;
    return;
  }
  if (!["admin", "security"].includes(user.role)) {
    guard.innerHTML = `<p style="color:var(--text-soft);">This page is only available to staff accounts. Your account (<b>${user.role}</b>) doesn't have access.</p>`;
    return;
  }

  content.style.display = "block";

  try {
    const [stats, items] = await Promise.all([
      apiFetch("/admin/stats", { auth: true }),
      apiFetch("/admin/items", { auth: true }),
    ]);

    document.getElementById("admin-total").textContent = stats.totalPosted;
    document.getElementById("admin-resolved").textContent = stats.reunited;
    document.getElementById("admin-avg").textContent = stats.avgResolveDays !== null ? `${stats.avgResolveDays}d` : "—";

    document.getElementById("breakdown-status").innerHTML = breakdownHTML(stats.byStatus, stats.totalPosted);
    document.getElementById("breakdown-category").innerHTML = breakdownHTML(stats.byCategory, stats.totalPosted);

    document.getElementById("admin-items-count").textContent = `${items.length} item${items.length === 1 ? "" : "s"}`;
    const tbody = document.getElementById("admin-items-body");
    tbody.innerHTML = items.map(adminRowHTML).join("");

    tbody.addEventListener("change", async (e) => {
      if (!e.target.classList.contains("status-select")) return;
      const row = e.target.closest("tr");
      const itemId = row.dataset.itemId;
      try {
        await apiFetch(`/items/${itemId}/status`, {
          method: "PATCH",
          body: { status: e.target.value, note: "Updated by staff via admin dashboard" },
          auth: true,
        });
      } catch (err) {
        alert(err.message);
        loadAdmin();
      }
    });

    tbody.addEventListener("click", async (e) => {
      if (e.target.dataset.action !== "delete") return;
      const row = e.target.closest("tr");
      const itemId = row.dataset.itemId;
      if (!confirm("Delete this item permanently?")) return;
      try {
        await apiFetch(`/items/${itemId}`, { method: "DELETE", auth: true });
        row.remove();
      } catch (err) {
        alert(err.message);
      }
    });
  } catch (err) {
    guard.innerHTML = `<p style="color:var(--rust);">Couldn't load admin data — ${err.message}</p>`;
    content.style.display = "none";
  }
}

document.addEventListener("DOMContentLoaded", loadAdmin);
