/* Profile menu: about info + clear-data option. */
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
        toast("Vanilla JS music player demo. Sample tracks only; likes/playlists save on this device.", 4200);
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
})();