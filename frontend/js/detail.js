// ---------------------------------------------------------------
// Item detail page — fetches one item + its matches from the API,
// renders the status timeline from statusHistory, and handles the
// claim flow (verification questions -> POST /items/:id/claim).
// ---------------------------------------------------------------

const STEPS = ["posted", "claimed", "resolved"];

function formatDate(dateStr) {
  return new Date(dateStr).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
}
function timeAgoLong(dateStr) {
  const days = Math.max(0, Math.round((Date.now() - new Date(dateStr)) / 86400000));
  if (days === 0) return "Posted today";
  if (days === 1) return "Posted yesterday";
  return `Posted ${days} days ago`;
}

function renderTimeline(item) {
  const timelineEl = document.getElementById("detail-timeline");
  const historyByStatus = {};
  (item.statusHistory || []).forEach((h) => (historyByStatus[h.status] = h.timestamp));

  const currentIndex = STEPS.indexOf(item.status);

  timelineEl.innerHTML = STEPS.map((step, i) => {
    let stateClass = "";
    if (i < currentIndex) stateClass = "done";
    else if (i === currentIndex) stateClass = "current";

    const time = historyByStatus[step]
      ? formatDate(historyByStatus[step])
      : i === currentIndex
      ? "In progress"
      : "—";

    return `
      <div class="timeline-step ${stateClass}">
        <div class="timeline-dot"></div>
        <span class="label">${step[0].toUpperCase()}${step.slice(1)}</span>
        <span class="time">${time}</span>
      </div>`;
  }).join("");
}

function renderMatches(matches) {
  const list = document.getElementById("match-list");
  const head = document.getElementById("matches-head");
  if (!matches.length) {
    head.style.display = "none";
    list.innerHTML = "";
    return;
  }
  head.style.display = "flex";
  list.innerHTML = matches
    .map(
      ({ item, score }) => `
      <a class="match-row" href="item-detail.html?id=${item._id}" style="text-decoration:none; color:inherit;">
        <div class="match-thumb"></div>
        <div class="match-info">
          <b>${item.type === "found" ? "Found" : "Lost"}: ${item.title}</b>
          <span>${item.location} · ${timeAgoLong(item.date).replace("Posted ", "")}</span>
        </div>
        <span class="match-score">${score}% match</span>
      </a>`
    )
    .join("");
}

function renderClaimForm(item) {
  const claimBtn = document.getElementById("claim-btn");
  const claimForm = document.getElementById("claim-form");
  const claimBox = document.getElementById("claim-box");

  // Owner shouldn't be able to claim their own post
  const user = getUser();
  if (user && item.postedBy && (item.postedBy._id === user._id || item.postedBy === user._id)) {
    claimBox.innerHTML = "<p>This is your own post — track its status above.</p>";
    return;
  }
  if (item.status === "resolved") {
    claimBox.innerHTML = "<p>This item has already been resolved.</p>";
    return;
  }

  claimBtn.addEventListener("click", () => {
    claimBtn.style.display = "none";
    const questions = item.verificationQuestions || [];
    claimForm.innerHTML =
      (questions.length
        ? questions
            .map(
              (q, i) => `
        <div class="field">
          <label>${q.question}</label>
          <input type="text" data-question="${q.question}" required />
        </div>`
            )
            .join("")
        : `<div class="field"><label>Briefly describe why this is yours</label><textarea data-question="General description" required></textarea></div>`) +
      `<button type="submit" class="btn btn-primary" style="width:100%;">Submit claim</button>`;
    claimForm.style.display = "block";
  });

  claimForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    if (!requireLogin("Please log in to claim an item.")) return;

    const answers = Array.from(claimForm.querySelectorAll("[data-question]")).map((el) => ({
      question: el.dataset.question,
      answer: el.value,
    }));

    try {
      await apiFetch(`/items/${item._id}/claim`, { method: "POST", body: { answers }, auth: true });
      alert("Claim submitted! The person who posted this item will review it.");
      window.location.reload();
    } catch (err) {
      alert(err.message);
    }
  });
}

async function loadItem() {
  const id = new URLSearchParams(window.location.search).get("id");
  const loadingMsg = document.getElementById("loading-msg");

  if (!id) {
    loadingMsg.textContent = "No item specified.";
    return;
  }

  try {
    const item = await apiFetch(`/items/${id}`);

    document.getElementById("page-title").textContent = `${item.title} — DPG Lost & Found`;
    document.getElementById("detail-title").textContent = item.title;
    document.getElementById("detail-type-badge").textContent = item.type;
    document.getElementById("detail-type-badge").className = `tag-badge ${item.type}`;
    document.getElementById("detail-posted-ago").textContent = `${item._id} · ${timeAgoLong(item.createdAt || item.date)}`;
    document.getElementById("detail-category").textContent = item.category;
    document.getElementById("detail-location").textContent = item.location;
    document.getElementById("detail-date").textContent = formatDate(item.date);
    document.getElementById("detail-postedby").textContent = item.postedBy?.name || "—";
    document.getElementById("detail-description").textContent = item.description || "No description provided.";

    if (item.imageUrl) {
      const img = document.getElementById("detail-image");
      img.style.background = "none";
      document.getElementById("detail-image-placeholder").style.display = "none";
      const imgTag = document.createElement("img");
      imgTag.src = `${API_BASE.replace("/api", "")}${item.imageUrl}`;
      imgTag.style.cssText = "width:100%;height:100%;object-fit:cover;border-radius:var(--radius);";
      img.appendChild(imgTag);
    }

    renderTimeline(item);
    renderClaimForm(item);

    loadingMsg.style.display = "none";
    document.getElementById("detail-layout").style.display = "grid";

    // Matches load separately so a slow match query doesn't block the item itself
    apiFetch(`/items/${id}/matches`).then(renderMatches).catch(() => {});
  } catch (err) {
    loadingMsg.textContent = `Couldn't load this item — ${err.message}`;
  }
}

document.addEventListener("DOMContentLoaded", loadItem);
