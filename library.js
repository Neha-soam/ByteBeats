/* Step 4: views, search, favorites, playlists (saved in localStorage) */
(() => {
  const $ = (s) => document.querySelector(s);
  const store = {
    get(k, d) { try { return JSON.parse(localStorage.getItem(k)) ?? d; } catch { return d; } },
    set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) { console.warn(e); } },
  };
  let favs = store.get("sp_favorites", []);      // [songId]
  let lists = store.get("sp_playlists", []);     // [{id, name, songIds}]
  const save = () => { store.set("sp_favorites", favs); store.set("sp_playlists", lists); };
  const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const byId = (id) => SONGS.find((s) => s.id === id);
  const home = $("#view-home"), view = $("#view-list"), libBox = $(".lib-box");
  const navs = document.querySelectorAll(".nav .nav-option");
  let route = { name: "home" };

  /* ---------- navigation ---------- */
  function go(name, id) { route = { name, id }; render(); }

  function render() {
    const isHome = route.name === "home";
    home.hidden = !isHome; view.hidden = isHome;
    navs[0].style.opacity = ""; // remove the old inline style
    navs.forEach((n, i) => n.classList.toggle("active",
      (i === 0 && isHome) || (i === 1 && route.name === "search") ||
      (i === 2 && ["library", "favorites", "playlist"].includes(route.name))));
    if (!isHome) {
      if (route.name === "search") {
        view.innerHTML = `<h2>Search</h2><input id="search-input" type="search" placeholder="Songs, artists or albums" aria-label="Search songs, artists and albums" autocomplete="off"><div id="results" aria-live="polite"></div>`;
        $("#search-input").addEventListener("input", drawResults);
        drawResults();
        $("#search-input").focus();
      } else if (route.name === "queue") {
        const q = Player.queue.map((id, i) => [byId(id), i]);
        view.innerHTML = `<h2>Queue</h2><h3>Now playing</h3>${rows([Player.current], false)}<h3>Next up</h3>` + (q.length
          ? `<ul class="song-list">${q.map(([s, i]) => `<li class="song-row"><span class="row-play"><img src="${s.cover}" alt=""><span class="row-text"><b>${esc(s.title)}</b><small>${esc(s.artist)}</small></span></span><button class="icon-btn" data-act="unqueue" data-qi="${i}" aria-label="Remove ${esc(s.title)} from queue"><i class="fa-solid fa-xmark"></i></button></li>`).join("")}</ul>`
          : `<p class="empty">Nothing queued. Use the queue button on a song to line it up next.</p>`);
      } else if (route.name === "favorites") {
        view.innerHTML = `<h2>Liked Songs</h2>${rows(favs.map(byId).filter(Boolean), false, "Tap the heart on any song to save it here.")}`;
      } else if (route.name === "playlist") {
        const pl = lists.find((l) => l.id === route.id);
        if (!pl) return go("library");
        view.innerHTML = `<div class="pl-head"><h2>${esc(pl.name)}</h2><button class="badge" data-act="rename">Rename</button><button class="badge" data-act="delete">Delete</button></div>${rows(pl.songIds.map(byId).filter(Boolean), true, "This playlist is empty. Use + on a song to add it.")}`;
      } else {
        view.innerHTML = `<h2>Your Library</h2><div class="lib-page"></div>`;
        drawLibList(view.querySelector(".lib-page"));
      }
    }
    drawSidebar();
  }

  function refresh() { route.name === "search" ? drawResults() : render(); }

  /* ---------- song rows ---------- */
  function rows(songs, inPlaylist, emptyMsg = "Nothing here yet.") {
    if (!songs.length) return `<p class="empty">${emptyMsg}</p>`;
    const cur = window.Player.current;
    return `<ul class="song-list">${songs.map((s) => {
      const liked = favs.includes(s.id);
      return `<li class="song-row${cur.id === s.id ? " playing" : ""}" data-id="${s.id}">
        <button class="row-play" data-act="play" aria-label="Play ${esc(s.title)} by ${esc(s.artist)}"><img src="${s.cover}" alt=""><span class="row-text"><b>${esc(s.title)}</b><small>${esc(s.artist)} • ${esc(s.album)}</small></span></button>
        <button class="icon-btn" data-act="fav" aria-pressed="${liked}" aria-label="${liked ? "Unlike" : "Like"} ${esc(s.title)}"><i class="fa-${liked ? "solid" : "regular"} fa-heart" style="${liked ? "color:#1bd760" : ""}"></i></button>
        <button class="icon-btn" data-act="add" aria-label="Add ${esc(s.title)} to playlist"><i class="fa-solid fa-plus"></i></button>
        <button class="icon-btn" data-act="queue" aria-label="Add ${esc(s.title)} to queue"><i class="fa-solid fa-list-ol"></i></button>
        ${inPlaylist ? `<button class="icon-btn" data-act="remove" aria-label="Remove ${esc(s.title)} from playlist"><i class="fa-solid fa-xmark"></i></button>` : ""}
      </li>`;
    }).join("")}</ul>`;
  }

  function drawResults() {
    const q = ($("#search-input").value || "").trim().toLowerCase();
    const found = q ? SONGS.filter((s) => [s.title, s.artist, s.album].some((x) => x.toLowerCase().includes(q))) : SONGS;
    $("#results").innerHTML = (q ? `<p class="empty">${found.length} result${found.length === 1 ? "" : "s"}</p>` : "") +
      rows(found, false, "No songs match your search.");
  }

  view.addEventListener("click", async (e) => {
    const btn = e.target.closest("[data-act]");
    if (!btn) return;
    const row = btn.closest(".song-row");
    const id = row && Number(row.dataset.id);
    const act = btn.dataset.act;
    if (act === "play") window.Player.playById(id);
    else if (act === "queue") { Player.addToQueue(id); const l = $("#live"); if (l) l.textContent = "Added to queue"; }
    else if (act === "unqueue") Player.removeFromQueue(Number(btn.dataset.qi));
    else if (act === "fav") toggleFav(id);
    else if (act === "add") openMenu(btn, id);
    else if (act === "remove") { const pl = lists.find((l) => l.id === route.id); pl.songIds = pl.songIds.filter((x) => x !== id); save(); refresh(); }
    else if (act === "rename") {
      const pl = lists.find((l) => l.id === route.id);
      const n = await Dialog.text("Rename playlist", "Playlist name", pl.name);
      if (n) { pl.name = n; save(); render(); }
    } else if (act === "delete") {
      const pl = lists.find((l) => l.id === route.id);
      if (await Dialog.confirm("Delete playlist?", `This will permanently delete "${esc(pl.name)}".`, "Delete")) { lists = lists.filter((l) => l.id !== pl.id); save(); go("library"); }
    }
  });

  /* ---------- favorites ---------- */
  function toggleFav(id) {
    favs = favs.includes(id) ? favs.filter((x) => x !== id) : [...favs, id];
    save(); updateHeart(); refresh(); drawSidebar();
  }
  const heartBtn = $(".heart");
  function updateHeart() {
    const liked = favs.includes(window.Player.current.id);
    heartBtn.querySelector("i").className = `fa-${liked ? "solid" : "regular"} fa-heart`;
    heartBtn.style.color = liked ? "#1bd760" : "";
    heartBtn.setAttribute("aria-pressed", liked);
    heartBtn.setAttribute("aria-label", liked ? "Unlike song" : "Like song");
  }
  heartBtn.addEventListener("click", () => toggleFav(window.Player.current.id));
  document.addEventListener("songchange", () => { updateHeart(); if (route.name !== "home") refresh(); });

  /* ---------- playlists ---------- */
  async function createPlaylist(songId) {
    const name = await Dialog.text("Name your playlist", "Playlist name", `My playlist #${lists.length + 1}`);
    if (!name) return null;
    const pl = { id: Date.now().toString(36), name, songIds: songId ? [songId] : [] };
    lists.push(pl); save(); return pl;
  }
  function drawLibList(el) {
    el.innerHTML = `<button class="lib-item" data-go="queue"><i class="fa-solid fa-list"></i>Queue (${Player.queue.length})</button><button class="lib-item" data-go="favorites"><i class="fa-solid fa-heart"></i>Liked Songs (${favs.length})</button>` +
      lists.map((l) => `<button class="lib-item${route.name === "playlist" && route.id === l.id ? " active" : ""}" data-go="playlist" data-id="${l.id}"><i class="fa-solid fa-music"></i>${esc(l.name)} (${l.songIds.length})</button>`).join("") +
      `<button class="badge" data-create="1">Create playlist</button>`;
  }
  function drawSidebar() { drawLibList(libBox); }
  async function onLibClick(e) {
    const b = e.target.closest("button");
    if (!b) return;
    if (b.dataset.create) { const pl = await createPlaylist(); if (pl) go("playlist", pl.id); }
    else if (b.dataset.go) go(b.dataset.go, b.dataset.id);
  }
  libBox.addEventListener("click", onLibClick);
  view.addEventListener("click", (e) => { if (e.target.closest(".lib-page")) onLibClick(e); });
  $(".icons .icon-btn").addEventListener("click", async () => { const pl = await createPlaylist(); if (pl) go("playlist", pl.id); });

  /* ---------- "add to playlist" menu ---------- */
  let menu = null;
  function closeMenu() { if (menu) { menu.remove(); menu = null; } }
  function openMenu(btn, songId) {
    closeMenu();
    menu = document.createElement("div");
    menu.className = "menu"; menu.setAttribute("role", "menu");
    menu.innerHTML = lists.map((l) => `<button role="menuitem" data-pl="${l.id}"><i class="fa-solid ${l.songIds.includes(songId) ? "fa-check" : "fa-fw"}"></i>${esc(l.name)}</button>`).join("") +
      `<button role="menuitem" data-new="1"><i class="fa-solid fa-plus"></i>New playlist</button>`;
    const r = btn.getBoundingClientRect();
    menu.style.top = Math.max(8, Math.min(r.bottom, innerHeight - 40 - 40 * (lists.length + 1))) + "px";
    menu.style.left = Math.max(8, Math.min(r.left, innerWidth - 210)) + "px";
    menu.addEventListener("click", async (e) => {
      const b = e.target.closest("button");
      if (!b) return;
      if (b.dataset.new) await createPlaylist(songId);
      else {
        const pl = lists.find((l) => l.id === b.dataset.pl);
        pl.songIds = pl.songIds.includes(songId) ? pl.songIds.filter((x) => x !== songId) : [...pl.songIds, songId];
        save();
      }
      closeMenu(); refresh(); drawSidebar();
    });
    document.body.append(menu);
    menu.querySelector("button").focus();
  }
  document.addEventListener("click", (e) => { if (menu && !menu.contains(e.target) && !e.target.closest('[data-act="add"]')) closeMenu(); });
  document.addEventListener("keydown", (e) => { if (e.key === "Escape") closeMenu(); });

  /* ---------- top nav ---------- */
  ["home", "search", "library"].forEach((name, i) =>
    navs[i].addEventListener("click", (e) => { e.preventDefault(); go(name); }));

  /* ---------- recently played (home) + queue events ---------- */
  const recent = home.querySelector(".cards-container");
  function drawRecent() {
    const ids = Player.history.slice(0, 6);
    recent.innerHTML = ids.length ? ids.map((id) => { const s = byId(id); return `<div class="card" role="button" tabindex="0" data-recent="${id}" aria-label="Play ${esc(s.title)}"><img src="${s.cover}" class="card-img" alt=""><p class="card-tittle">${esc(s.title)}</p><p class="card-info">${esc(s.artist)}</p></div>`; }).join("")
      : `<p class="empty">Songs you play will show up here.</p>`;
  }
  const playRecent = (t) => { const c = t.closest("[data-recent]"); if (c) Player.playById(Number(c.dataset.recent)); };
  recent.addEventListener("click", (e) => playRecent(e.target));
  recent.addEventListener("keydown", (e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); playRecent(e.target); } });
  document.addEventListener("historychange", drawRecent);
  document.addEventListener("queuechange", () => { if (route.name === "queue") render(); else drawSidebar(); });
  $('[aria-label="Queue"]').addEventListener("click", () => go("queue"));

  drawRecent();
  updateHeart();
  render();
})();