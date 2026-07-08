# Flow

A simple, fast time tracker for iPhone. Dark interface. Track how you spend your day, hit daily goals, and review your week.

**No Apple Developer account. No Expo Go. No Mac needed after setup.**

---

## Install on your iPhone (works offline forever)

Flow is a **home screen app**. You install it once, then it runs entirely on your phone — no WiFi, no Mac, no internet.

### Step 1 — Put it online once (5 minutes, one time only)

Apple requires **HTTPS** for home screen apps. Use free GitHub Pages:

**On your Mac:**

```bash
cd ~/Projects/flow
git init
git add pwa .github README.md
git commit -m "Add Flow PWA"
```

Create a repo on GitHub (github.com → New repository → name it `flow`), then:

```bash
git remote add origin https://github.com/YOUR_USERNAME/flow.git
git branch -M main
git push -u origin main
```

**On GitHub:** open your repo → **Settings → Pages** → Source: **GitHub Actions**.

Wait ~1 minute for the deploy workflow to finish. Your app will be at:

```
https://YOUR_USERNAME.github.io/flow/
```

### Step 2 — Install on your iPhone (cellular is fine)

1. On your iPhone, open **Safari**
2. Go to `https://YOUR_USERNAME.github.io/flow/` (cellular or any WiFi — **not** your Mac)
3. Wait for the page to load fully
4. Tap **Share → Add to Home Screen** → name it **Flow**
5. Open **Flow** from your home screen and use it once while online (this caches everything)

### Step 3 — Done

Turn on **Airplane Mode** and open Flow. Timer, logs, charts, and habits all work. Data stays on your phone.

---

## Quick test on same WiFi (optional)

Only for development — not needed for daily use:

```bash
cd ~/Projects/flow/pwa
python3 -m http.server 8080
```

On iPhone (same WiFi): `http://YOUR-MAC-IP:8080`

---

## Why not a "real" App Store app?

Apple requires a **$99/year Developer account** to install native apps on your iPhone. The home screen web app is Apple's free alternative — full screen, own icon, works offline.

---

## Features

- **Timer** — start/stop tracking any activity
- **Today** — hours remaining, time breakdown charts, daily checklist
- **Week** — daily hours bar chart, activity breakdown, goal progress
- **Goals** — manage activities, set daily targets, edit daily habits

All data stays on your phone (local storage). Nothing is sent anywhere.

---

## Project layout

```
pwa/          ← The iPhone app (no Node needed)
  index.html
  app.js
  styles.css
  sw.js         ← Offline cache

app/          ← React Native version (optional, needs Node + Expo)
```
