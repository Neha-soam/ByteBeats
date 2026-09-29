/* Profile menu + a real "Install App" (PWA) prompt, with an honest fallback message. */
(() => {
  const $ = (s) => document.querySelector(s);

  /* ---------- tiny toast helper ---------- */
  function toast(msg, ms = 2600) {
    let t = $("#toast");
    if (!t) { t = document.createElement("div"); t.id = "toast"; t.className = "toast"; t.setAttribute("role", "status"); document.body.append(t); }
    t.textContent = msg;
    t.classList.add("show");
    clearTimeout(toast._timer);
    toast._timer = setTimeout(() => t.classList.remove("show"), ms);
  }

  /* ---------- profile dropdown ---------- */
  const profileBtn = $("#profile-btn");
  let menu = null;
  function closeMenu() { if (menu) { menu.remove(); menu = null; } }
  profileBtn.addEventListener("click", (e) => {
    e.stopPropagation();
    if (menu) { closeMenu(); return; }
    menu = document.createElement("div");
    menu.className = "menu profile-menu";
    menu.setAttribute("role", "menu");
    menu.innerHTML = `
      <div class="profile-menu-head">Guest</div>
      <button role="menuitem" data-act="about"><i class="fa-solid fa-circle-info"></i>About this player</button>
      <button role="menuitem" data-act="reset"><i class="fa-solid fa-trash"></i>Clear my data</button>`;
    const r = profileBtn.getBoundingClientRect();
    menu.style.top = r.bottom + 6 + "px";
    menu.style.right = window.innerWidth - r.right + "px";
    document.body.append(menu);
    menu.querySelector("button").focus();
    menu.addEventListener("click", async (ev) => {
      const b = ev.target.closest("button");
      if (!b) return;
      if (b.dataset.act === "about") {
        toast("Vanilla JS Spotify-style player. Sample tracks only; likes/playlists save on this device.", 4200);
      } else if (b.dataset.act === "reset") {
        if (await Dialog.confirm("Clear your data?", "This removes your liked songs, playlists, history and theme on this device.", "Clear")) {
          ["sp_favorites", "sp_playlists", "sp_history", "sp_volume", "sp_theme"].forEach((k) => { try { localStorage.removeItem(k); } catch {} });
          toast("Cleared. Reloading\u2026");
          setTimeout(() => location.reload(), 700);
        }
      }
      closeMenu();
    });
  });
  document.addEventListener("click", (e) => { if (menu && !menu.contains(e.target) && e.target !== profileBtn && !profileBtn.contains(e.target)) closeMenu(); });
  document.addEventListener("keydown", (e) => { if (e.key === "Escape") closeMenu(); });

  /* ---------- Install App: small confirm popup, then redirect to real Spotify ---------- */
  const installBtn = $("#install-app-btn");
  function showInstallPopup() {
    const overlay = document.createElement("div");
    overlay.className = "install-overlay";
    overlay.innerHTML = `
      <div class="install-modal" role="dialog" aria-modal="true" aria-labelledby="install-title">
        <img src="album_picture.jpeg" alt="" class="install-icon">
        <h3 id="install-title">Install Spotify?</h3>
        <p>You'll be taken to Spotify's official site to install the app.</p>
        <div class="install-actions">
          <button class="badge" data-act="cancel">Cancel</button>
          <button class="badge dark-badge" data-act="install">Install</button>
        </div>
      </div>`;
    document.body.append(overlay);
    overlay.querySelector('[data-act="install"]').focus();
    function close() { overlay.remove(); document.removeEventListener("keydown", onKey); }
    function onKey(e) { if (e.key === "Escape") close(); }
    document.addEventListener("keydown", onKey);
    overlay.addEventListener("click", (e) => {
      if (e.target === overlay || e.target.dataset.act === "cancel") return close();
      if (e.target.dataset.act === "install") {
        close();
        toast("Redirecting to Spotify\u2026", 1200);
        setTimeout(() => window.open("https://www.spotify.com/download/", "_blank", "noopener"), 500);
      }
    });
  }
  installBtn.addEventListener("click", showInstallPopup);
})();