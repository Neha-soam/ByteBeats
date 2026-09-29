# Spotify-Style Music Player

A fully functional, Spotify-inspired music player built with **vanilla HTML, CSS, and JavaScript** — no frameworks, no backend, no build tools.

## Features

- **Playback** — play/pause, next/previous, seek bar with current time & duration, volume slider with mute, resumes from where you left off on reload
- **Search** — live filtering across song title, artist, and album
- **Playlists** — create, rename, delete, add/remove songs, saved in `localStorage`
- **Favorites** — like any song, view them in a dedicated "Liked Songs" page
- **Queue** — add songs to play next, view/remove upcoming tracks
- **Shuffle & Repeat** — off / repeat-all / repeat-one modes
- **Recently Played** — automatically tracked and shown on the Home page
- **Theme toggle** — dark/light mode, remembered across visits
- **Responsive** — desktop, tablet (icon-only sidebar), and mobile (bottom tab bar) layouts
- **Accessible** — keyboard shortcuts, focus indicators, ARIA labels, skip-to-content link

### Keyboard shortcuts
| Key | Action |
|---|---|
| `Space` | Play / Pause |
| `←` / `→` | Seek -5s / +5s |
| `Shift + ↑` / `Shift + ↓` | Volume up / down |
| `N` / `P` | Next / Previous song |
| `M` | Mute / Unmute |
| `Esc` | Close open menu or dialog |

## Tech stack

- **HTML5** — semantic markup, `<audio>` element for playback
- **CSS3** — Flexbox & Grid, CSS variables, media queries for responsiveness, `prefers-reduced-motion` support
- **Vanilla JavaScript (ES6+)** — no frameworks or libraries; uses the HTML5 Audio API, `localStorage`, and custom events for module communication
- **Font Awesome** — icons (loaded via CDN)
- **Google Fonts (Montserrat)** — typography

## Project structure

```
├── index.html        # Page structure & layout
├── style.css          # All styling (base design + responsive + theme)
├── data/
│   └── songs.js       # Sample song data (title, artist, album, cover, audio URL)
├── script.js          # Core audio engine: play/pause, seek, shuffle, repeat, volume, queue, resume
├── library.js         # Views/routing, search, playlists, favorites, recently played
├── dialogs.js         # Styled prompt/confirm modal replacement
├── ui.js              # Theme toggle + keyboard shortcuts
└── extras.js          # Profile menu, "Install App" popup
```

## Getting started

Because this project uses `fetch`-free, same-origin JS modules and localStorage, it's best run through a local server rather than opened directly as a `file://` page:

```bash
# Option 1: VS Code — install the "Live Server" extension, then
# right-click index.html → "Open with Live Server"

# Option 2: Python
python -m http.server 8000
# then open http://localhost:8000
```

Opening `index.html` directly by double-clicking also works for most features, but browsers restrict a few things (like install prompts) to pages served over `http(s)`.

## Audio credits

Sample tracks are royalty-free demo files from [SoundHelix](https://www.soundhelix.com), used for demonstration purposes only. Song titles and artist names in `data/songs.js` are placeholders — replace them with your own licensed audio and metadata before any public/production use.

## License

This project is for personal/educational use. Replace sample audio before any commercial deployment.
