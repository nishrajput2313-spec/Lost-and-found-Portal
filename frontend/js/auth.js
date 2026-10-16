// ---------------------------------------------------------------
// Session storage + nav auth state, shared across every page.
// ---------------------------------------------------------------
const SESSION_KEYS = { token: "dpg-lnf-token", user: "dpg-lnf-user" };

function getToken() {
  return localStorage.getItem(SESSION_KEYS.token);
}
function getUser() {
  const raw = localStorage.getItem(SESSION_KEYS.user);
  return raw ? JSON.parse(raw) : null;
}
function setSession(user, token) {
  localStorage.setItem(SESSION_KEYS.token, token);
  localStorage.setItem(SESSION_KEYS.user, JSON.stringify(user));
}
function clearSession() {
  localStorage.removeItem(SESSION_KEYS.token);
  localStorage.removeItem(SESSION_KEYS.user);
}
function requireLogin(redirectMessage) {
  if (getToken()) return true;
  alert(redirectMessage || "Please log in first.");
  window.location.href = "login.html";
  return false;
}

// Swap the "Log In" link for "Hi, <name>" + Logout wherever it appears
// (desktop nav and mobile panel both use [data-auth-slot]).
function paintAuthState() {
  const user = getUser();
  document.querySelectorAll("[data-auth-slot]").forEach((slot) => {
    if (user) {
      const adminLink = user.role === "admin" || user.role === "security"
        ? `<a href="admin.html">Admin</a> `
        : "";
      slot.innerHTML = `${adminLink}<a href="my-posts.html">Hi, ${user.name.split(" ")[0]}</a> <a href="#" data-logout>Log out</a>`;
    } else {
      slot.innerHTML = `<a href="login.html">Log In</a>`;
    }
  });
  document.querySelectorAll("[data-logout]").forEach((btn) => {
    btn.addEventListener("click", (e) => {
      e.preventDefault();
      clearSession();
      window.location.href = "index.html";
    });
  });
}

document.addEventListener("DOMContentLoaded", () => {
  paintAuthState();

  const loginForm = document.getElementById("login-form");
  if (loginForm) {
    loginForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      const email = document.getElementById("email").value;
      const password = document.getElementById("password").value;
      try {
        const data = await apiFetch("/auth/login", { method: "POST", body: { email, password } });
        setSession({ _id: data._id, name: data.name, email: data.email, role: data.role }, data.token);
        window.location.href = "index.html";
      } catch (err) {
        alert(err.message);
      }
    });
  }

  const signupForm = document.getElementById("signup-form");
  if (signupForm) {
    signupForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      const name = document.getElementById("name").value;
      const email = document.getElementById("email").value;
      const password = document.getElementById("password").value;
      try {
        const data = await apiFetch("/auth/signup", { method: "POST", body: { name, email, password } });
        setSession({ _id: data._id, name: data.name, email: data.email, role: data.role }, data.token);
        window.location.href = "index.html";
      } catch (err) {
        alert(err.message);
      }
    });
  }
});
