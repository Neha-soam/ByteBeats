/* Step 6: theme toggle + keyboard shortcuts */
(() => {
  const root = document.documentElement;
  const btn = document.getElementById("theme-toggle");
  let theme = "dark";
  try { theme = localStorage.getItem("sp_theme") || "dark"; } catch {}

  function apply() {
    const light = theme === "light";
    root.dataset.theme = theme;
    btn.querySelector("i").className = "fa-solid " + (light ? "fa-moon" : "fa-sun");
    btn.setAttribute("aria-label", light ? "Switch to dark theme" : "Switch to light theme");
    try { localStorage.setItem("sp_theme", theme); } catch {}
  }
  btn.addEventListener("click", () => { theme = theme === "light" ? "dark" : "light"; apply(); });
  apply();

  // Shortcuts: Space play/pause, ←/→ seek 5s, Shift+↑/↓ volume, N next, P previous, M mute
  document.addEventListener("keydown", (e) => {
    if (e.ctrlKey || e.metaKey || e.altKey) return;
    const t = e.target;
    if (t.matches("input[type=search], input[type=text], textarea")) return;
    const onRange = t.matches("input[type=range]");
    const onControl = t.closest("button, a, [role=button]");
    const P = window.Player;
    switch (e.key) {
      case " ": if (!onControl) { e.preventDefault(); P.togglePlay(); } break;
      case "ArrowRight": if (!onRange) P.audio.currentTime += 5; break;
      case "ArrowLeft": if (!onRange) P.audio.currentTime -= 5; break;
      case "ArrowUp": if (e.shiftKey) { e.preventDefault(); P.nudgeVolume(0.1); } break;
      case "ArrowDown": if (e.shiftKey) { e.preventDefault(); P.nudgeVolume(-0.1); } break;
      case "n": case "N": P.next(); break;
      case "p": case "P": P.prev(); break;
      case "m": case "M": P.toggleMute(); break;
    }
  });
})();