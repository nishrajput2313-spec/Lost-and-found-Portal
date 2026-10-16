LOST AND FOUND PORTAL - SIMPLE FRONTEND
=========================================

This is a plain HTML, CSS and JavaScript frontend. No frameworks,
no build tools - just open the .html files in a browser (or use
Live Server in VS Code).

FILES
-----
index.html          -> Browse / home page
login.html          -> Login form
signup.html         -> Signup form
post-item.html      -> Form to report a lost/found item
item-detail.html    -> Single item view + claim button
my-posts.html       -> Items posted by the logged-in user
admin.html          -> Admin dashboard (table with status/delete controls)

css/style.css       -> All the styling (one file, plain CSS)

js/api.js           -> All backend calls live here (fetch functions)
js/nav.js           -> Shows/hides navbar links based on login state
js/auth.js          -> Handles login + signup form submission
js/browse.js        -> Loads and filters items on the home page
js/post-item.js     -> Handles the post-item form (with photo upload)
js/item-detail.js   -> Loads one item and handles the claim flow
js/my-posts.js      -> Filters items to show only the current user's posts
js/admin.js         -> Loads all items into a table, handles status/delete

STEP 1: SET YOUR BACKEND URL
-----------------------------
Open js/api.js and change this line at the top to your real
Render backend URL:

    const BASE_URL = "https://your-backend-name.onrender.com";

STEP 2: CHECK THE API ENDPOINTS MATCH YOUR BACKEND
----------------------------------------------------
This frontend assumes your backend has these routes. If your
actual backend uses different paths or field names, just edit
the matching function inside js/api.js - each one is short and
commented.

  POST   /api/auth/signup        { name, email, password }
  POST   /api/auth/login         { email, password } -> { token, user }
  GET    /api/items                                   -> array of items
  GET    /api/items/:id                                -> one item
  POST   /api/items               (FormData, needs auth token, has photo)
  PATCH  /api/items/:id/claim      { answer }          (needs auth token)
  PATCH  /api/items/:id/status     { status }          (admin, needs auth token)
  DELETE /api/items/:id                                (admin, needs auth token)

The item object is expected to look roughly like this:
  {
    _id, name, type ("lost"/"found"), category, location,
    date, description, photo (a URL string), status
    ("posted"/"claimed"/"resolved"), postedBy (a user id)
  }

If your backend's field names are slightly different (e.g. "title"
instead of "name"), search for that field name in the js/ files
and rename it to match.

STEP 3: TEST LOCALLY
---------------------
Just double-click index.html to open it in your browser, or use
the VS Code "Live Server" extension for a nicer experience
(right-click index.html -> "Open with Live Server").

HOW THE LOGIN SYSTEM WORKS (for explaining in your viva/interview)
--------------------------------------------------------------------
1. User submits the login form (auth.js).
2. api.js sends the email/password to the backend.
3. Backend checks the password and sends back a JWT token + user info.
4. We save that token in the browser's localStorage (saveSession()).
5. On every page, nav.js checks if a token exists to decide whether
   to show "Login" or "Logout" in the navbar.
6. When posting an item or claiming one, we attach the token in the
   Authorization header so the backend knows who is making the request.

