function timeAgoShort(dateStr) {
  const days = Math.max(0, Math.round((Date.now() - new Date(dateStr)) / 86400000));
  if (days === 0) return "Today";
  if (days === 1) return "Yesterday";
  return `${days}d ago`;
}

function myPostCardHTML(item) {
  return `
    <a class="ticket" href="item-detail.html?id=${item._id}">
      <div class="ticket-image">
        ${item.imageUrl ? `<img src="${API_BASE.replace("/api", "")}${item.imageUrl}" alt="${item.title}" style="width:100%;height:100%;object-fit:cover;" />` : ""}
        <span class="tag-badge ${item.type}">${item.type}</span>
        ${item.imageUrl ? "" : "<span>Photo</span>"}
      </div>
      <div class="ticket-body">
        <h3>${item.title}</h3>
        <div class="ticket-meta"><span>${item.category}</span><span class="dot"></span><span>${item.location}</span></div>
      </div>
      <div class="ticket-stub">
        <span class="status-pill ${item.status}">${item.status}</span>
        <span>${timeAgoShort(item.createdAt)}</span>
      </div>
    </a>`;
}

async function loadMyPosts() {
  if (!requireLogin("Please log in to see your posts.")) return;

  const grid = document.getElementById("my-posts-grid");
  const countEl = document.getElementById("my-posts-count");

  try {
    const items = await apiFetch("/items/mine", { auth: true });
    countEl.textContent = `${items.length} item${items.length === 1 ? "" : "s"}`;
    grid.innerHTML = items.length
      ? items.map(myPostCardHTML).join("")
      : `<p style="color:var(--text-soft);">You haven't posted anything yet. <a href="post-item.html" style="color:var(--amber-deep); font-weight:600;">Post your first item →</a></p>`;
  } catch (err) {
    grid.innerHTML = `<p style="color:var(--rust);">Couldn't load your posts — ${err.message}</p>`;
  }
}

document.addEventListener("DOMContentLoaded", loadMyPosts);
