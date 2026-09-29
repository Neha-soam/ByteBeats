
/* Step 3: core playback (play/pause, next/prev, seek, song info, card clicks) */
(() => {
  const $ = (sel) => document.querySelector(sel);

  const audio = new Audio();
  audio.preload = "metadata";
  let current = 0;
  const load = (k, d) => { try { return JSON.parse(localStorage.getItem(k)) ?? d; } catch { return d; } };
  const put = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch {} };
  const emit = (n) => document.dispatchEvent(new CustomEvent(n));
  let queue = [];                          // song ids the user queued ("up next")
  let history = load("sp_history", []);    // recently played ids, newest first
  let shuffle = false, repeat = 0;         // repeat: 0 off, 1 all, 2 one
  let vol = load("sp_volume", 0.7), muted = false, lastLogged = null;
  const savedPos = load("sp_position", null); // {songId, time} from last visit
  let resumeTime = 0;

  const ui = {
    cover: $(".album-img"),
    title: $(".song-name"),
    artist: $(".song-artist"),
    playBtn: $(".play-btn"),
    playIcon: $(".play-btn i"),
    prevBtn: $('[aria-label="Previous song"]'),
    nextBtn: $('[aria-label="Next song"]'),
    seek: $(".playback-bar .progress-bar"),
    curTime: $(".curr-time"),
    totTime: $(".tot-time"),
    cards: document.querySelectorAll(".card"),
    shuffleBtn: $('[aria-label="Shuffle"]'),
    repeatBtn: $('[aria-label="Repeat"]'),
    muteBtn: $('[aria-label="Mute"]'),
    volume: $(".volume-bar"),
  };

  function fmt(t) {
    if (!isFinite(t)) return "0:00";
    const m = Math.floor(t / 60);
    const s = Math.floor(t % 60);
    return `${m}:${String(s).padStart(2, "0")}`;
  }

  /* ---------- resume where the user left off ---------- */
  function indexForId(id) { const i = SONGS.findIndex((s) => s.id === id); return i < 0 ? 0 : i; }
  function savePosition() {
    if (!SONGS[current]) return;
    put("sp_position", { songId: SONGS[current].id, time: audio.currentTime || 0 });
  }
  window.addEventListener("beforeunload", savePosition);
  setInterval(savePosition, 5000); // in case the tab is closed without firing beforeunload

  /* ---------- load a song into the player (does not start playback) ---------- */
  function loadSong(index) {
    current = (index + SONGS.length) % SONGS.length;
    const song = SONGS[current];
    audio.src = song.src;
    ui.cover.src = song.cover;
    ui.cover.alt = `${song.title} artwork`;
    ui.title.textContent = song.title;
    ui.artist.textContent = song.artist;
    ui.seek.value = 0;
    ui.seek.max = 100;
    ui.curTime.textContent = "0:00";
    ui.totTime.textContent = "0:00";
    document.title = `${song.title} - ${song.artist}`;
    const live = document.getElementById("live");
    if (live) live.textContent = `Now playing ${song.title} by ${song.artist}`;
    emit("songchange");
    document.dispatchEvent(new CustomEvent("songchange"));
    ui.cards.forEach((card) =>
      card.classList.toggle("playing", Number(card.dataset.index) === current)
    );
  }

  function playSong(index) {
    if (index !== undefined) loadSong(index);
    audio.play().catch((err) => {
      console.error("Playback failed:", err);
      ui.artist.textContent = "Couldn't play this track";
    });
  }

  function togglePlay() {
    if (audio.paused) playSong();
    else audio.pause();
  }

  function pickNext() {
    if (queue.length) { const id = queue.shift(); emit("queuechange"); return SONGS.findIndex((s) => s.id === id); }
    if (shuffle && SONGS.length > 1) { let i; do { i = Math.floor(Math.random() * SONGS.length); } while (i === current); return i; }
    return current + 1;
  }
  function next() { playSong(pickNext()); }
  function prev() {
    // like Spotify: past 3s restarts the song, otherwise go back one
    if (audio.currentTime > 3) audio.currentTime = 0;
    else playSong(current - 1);
  }

  /* ---------- audio events -> UI ---------- */
  audio.addEventListener("play", () => {
    ui.playIcon.className = "fa-solid fa-circle-pause";
    ui.playBtn.setAttribute("aria-label", "Pause");
    const id = SONGS[current].id;
    if (lastLogged !== id) {
      lastLogged = id;
      history = [id, ...history.filter((x) => x !== id)].slice(0, 12);
      put("sp_history", history); emit("historychange");
    }
  });
  audio.addEventListener("pause", () => {
    ui.playIcon.className = "fa-solid fa-circle-play";
    ui.playBtn.setAttribute("aria-label", "Play");
  });
  audio.addEventListener("loadedmetadata", () => {
    ui.seek.max = Math.floor(audio.duration);
    ui.totTime.textContent = fmt(audio.duration);
    if (resumeTime > 0 && resumeTime < audio.duration - 2) {
      audio.currentTime = resumeTime;
      ui.seek.value = resumeTime;
      ui.curTime.textContent = fmt(resumeTime);
    }
    resumeTime = 0;
  });
  audio.addEventListener("timeupdate", () => {
    ui.seek.value = audio.currentTime;
    ui.curTime.textContent = fmt(audio.currentTime);
    ui.seek.style.setProperty("--p", (audio.duration ? (audio.currentTime / audio.duration) * 100 : 0) + "%");
    ui.seek.setAttribute("aria-valuetext", `${fmt(audio.currentTime)} of ${fmt(audio.duration)}`);
  });
  audio.addEventListener("ended", () => {
    if (repeat === 2) { audio.currentTime = 0; playSong(); }
    else if (repeat === 0 && !shuffle && !queue.length && current === SONGS.length - 1) loadSong(0); // end of list: stop
    else next();
  });
  audio.addEventListener("error", () => {
    console.error("Audio error for", audio.src);
    ui.artist.textContent = "Couldn't load audio (check internet)";
  });

  /* ---------- controls ---------- */
  ui.playBtn.addEventListener("click", togglePlay);
  ui.nextBtn.addEventListener("click", next);
  ui.prevBtn.addEventListener("click", prev);
  ui.seek.addEventListener("input", () => {
    audio.currentTime = Number(ui.seek.value);
    ui.curTime.textContent = fmt(audio.currentTime);
  });

  /* ---------- shuffle, repeat, volume ---------- */
  function paintModes() {
    ui.shuffleBtn.classList.toggle("on", shuffle);
    ui.shuffleBtn.setAttribute("aria-pressed", shuffle);
    ui.repeatBtn.classList.toggle("on", repeat > 0);
    ui.repeatBtn.dataset.mode = repeat === 2 ? "one" : "";
    ui.repeatBtn.setAttribute("aria-pressed", repeat > 0);
    ui.repeatBtn.setAttribute("aria-label", ["Repeat off", "Repeat all", "Repeat one"][repeat]);
  }
  function paintVol() {
    audio.volume = vol; audio.muted = muted;
    ui.volume.value = muted ? 0 : vol * 100;
    ui.volume.style.setProperty("--p", ui.volume.value + "%");
    ui.muteBtn.querySelector("i").className = "fa-solid " + (muted || vol === 0 ? "fa-volume-xmark" : vol < 0.5 ? "fa-volume-low" : "fa-volume-high");
    ui.muteBtn.setAttribute("aria-label", muted ? "Unmute" : "Mute");
    ui.muteBtn.setAttribute("aria-pressed", muted);
  }
  const setVol = (v) => { vol = Math.min(1, Math.max(0, v)); muted = false; put("sp_volume", vol); paintVol(); };
  ui.shuffleBtn.addEventListener("click", () => { shuffle = !shuffle; paintModes(); });
  ui.repeatBtn.addEventListener("click", () => { repeat = (repeat + 1) % 3; paintModes(); });
  ui.volume.addEventListener("input", () => setVol(ui.volume.value / 100));
  ui.muteBtn.addEventListener("click", () => { muted = !muted; paintVol(); });

  /* ---------- cards: each one plays a song ---------- */
  ui.cards.forEach((card, i) => {
    const song = SONGS[i % SONGS.length];
    card.dataset.index = i % SONGS.length;
    card.setAttribute("role", "button");
    card.setAttribute("tabindex", "0");
    card.setAttribute("aria-label", `Play ${song.title} by ${song.artist}`);
    card.querySelector(".card-img").src = song.cover;
    card.querySelector(".card-img").alt = `${song.title} artwork`;
    card.querySelector(".card-tittle").textContent = song.title;
    card.querySelector(".card-info").textContent = `${song.artist} • ${song.album}`;

    const activate = () => {
      const idx = Number(card.dataset.index);
      if (idx === current && !audio.paused) audio.pause();
      else if (idx === current) playSong();
      else playSong(idx);
    };
    card.addEventListener("click", activate);
    card.addEventListener("keydown", (e) => {
      if (e.key === "Enter" || e.key === " ") { e.preventDefault(); activate(); }
    });
  });

  // small API used by library.js (search results, playlists, favorites)
  window.Player = {
    get current() { return SONGS[current]; },
    get queue() { return queue; },
    get history() { return history; },
    addToQueue(id) { queue.push(id); emit("queuechange"); },
    removeFromQueue(i) { queue.splice(i, 1); emit("queuechange"); },
    audio, togglePlay, next, prev,
    toggleMute() { muted = !muted; paintVol(); },
    nudgeVolume(d) { setVol(vol + d); },
    playById(id) {
      const i = SONGS.findIndex((s) => s.id === id);
      if (i < 0) return;
      if (i === current) togglePlay(); else playSong(i);
    },
  };

  paintModes(); paintVol();
  if (savedPos && SONGS.some((s) => s.id === savedPos.songId)) {
    resumeTime = savedPos.time || 0;
    loadSong(indexForId(savedPos.songId));
  } else {
    loadSong(0);
  } // show first song, wait for user to press play (browsers block autoplay)
})();