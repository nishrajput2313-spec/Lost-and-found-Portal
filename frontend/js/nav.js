// Mobile hamburger nav — shared across all pages.
document.addEventListener("DOMContentLoaded", () => {
  const hamburger = document.querySelector(".hamburger");
  const panel = document.querySelector(".mobile-panel");
  if (!hamburger || !panel) return;

  hamburger.addEventListener("click", () => {
    panel.classList.toggle("open");
  });

  // Close the panel when a link inside it is tapped.
  panel.querySelectorAll("a").forEach((link) => {
    link.addEventListener("click", () => panel.classList.remove("open"));
  });
});
