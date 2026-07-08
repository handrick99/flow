const STORAGE_KEY = '@flow/data';
const COLORS = ['#0a84ff', '#1ed760', '#64d2ff', '#bf5af2', '#ff375f', '#ffd60a', '#5ac8fa', '#ff9f0a'];

const CHECK_SVG = '<svg width="11" height="11" viewBox="0 0 12 12" fill="none"><path d="M2 6l3 3 5-5" stroke="#000" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>';

const DEFAULT = {
  activities: [
    { id: '1', name: 'Deep Work', color: '#0a84ff', targetMinutes: 240 },
    { id: '2', name: 'Exercise', color: '#1ed760', targetMinutes: 60 },
    { id: '3', name: 'Learning', color: '#bf5af2', targetMinutes: 60 },
    { id: '4', name: 'Social', color: '#ff375f', targetMinutes: 60 },
  ],
  checklist: [
    { id: 'c1', title: 'Morning routine', completedDates: [] },
    { id: 'c2', title: 'Review goals', completedDates: [] },
    { id: 'c3', title: 'Evening reflection', completedDates: [] },
  ],
  logs: [],
  activeTimer: null,
};

let state = load();
let tab = 'today';
let selectedId = state.activities[0]?.id ?? null;
let timerInterval = null;
let dayInterval = null;

function dayProgress() {
  const now = new Date();
  const start = new Date(now);
  start.setHours(0, 0, 0, 0);
  const midnight = new Date(now);
  midnight.setHours(24, 0, 0, 0);
  const totalMs = midnight - start;
  const elapsedMs = now - start;
  const remainingMs = Math.max(0, midnight - now);
  return {
    elapsedMinutes: Math.floor(elapsedMs / 60000),
    remainingMinutes: Math.floor(remainingMs / 60000),
    remainingSeconds: Math.floor(remainingMs / 1000),
    pctRemaining: (remainingMs / totalMs) * 100,
    pctElapsed: (elapsedMs / totalMs) * 100,
    hourOfDay: now.getHours() + now.getMinutes() / 60,
  };
}

function fmtUntilMidnight() {
  const { remainingSeconds } = dayProgress();
  const h = Math.floor(remainingSeconds / 3600);
  const m = Math.floor((remainingSeconds % 3600) / 60);
  if (h === 0) return `${m}m`;
  if (m === 0) return `${h}h`;
  return `${h}h ${m}m`;
}

function load() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return structuredClone(DEFAULT);
    const d = JSON.parse(raw);
    return {
      activities: d.activities?.length ? d.activities : DEFAULT.activities,
      checklist: d.checklist?.length ? d.checklist : DEFAULT.checklist,
      logs: d.logs ?? [],
      activeTimer: d.activeTimer ?? null,
    };
  } catch {
    return structuredClone(DEFAULT);
  }
}

function save() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

function id() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

function today() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function fmtDate(d) {
  return d.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });
}

function fmtDur(mins) {
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  if (!h) return `${m}m`;
  if (!m) return `${h}h`;
  return `${h}h ${m}m`;
}

function fmtTimer(sec) {
  const h = Math.floor(sec / 3600);
  const m = Math.floor((sec % 3600) / 60);
  const s = sec % 60;
  if (h) return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

function toHours(mins) {
  return Math.round((mins / 60) * 10) / 10;
}

function weekDates() {
  const ref = new Date();
  const day = ref.getDay();
  const mon = new Date(ref);
  mon.setDate(ref.getDate() - ((day + 6) % 7));
  const dates = [];
  for (let i = 0; i < 7; i++) {
    const d = new Date(mon);
    d.setDate(mon.getDate() + i);
    dates.push(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`);
  }
  return dates;
}

function dayLabel(str) {
  const [y, m, d] = str.split('-').map(Number);
  return new Date(y, m - 1, d).toLocaleDateString('en-US', { weekday: 'short' });
}

function elapsed() {
  if (!state.activeTimer) return 0;
  return Math.floor((Date.now() - state.activeTimer.startedAt) / 1000);
}

function startTick() {
  clearInterval(timerInterval);
  clearInterval(dayInterval);

  const tick = () => {
    if (state.activeTimer) {
      const el = document.querySelector('.timer-time');
      if (el) el.textContent = fmtTimer(elapsed());
    }
    if (tab === 'today') updateDayDisplay();
  };

  timerInterval = setInterval(tick, 1000);
  if (tab === 'today') tick();
}

function dayDrain() {
  const p = dayProgress();
  const nowPct = (p.hourOfDay / 24) * 100;
  return `
    <div class="day-drain">
      <div class="day-drain-top">
        <div class="day-volume-track">
          <div class="day-volume-fill" style="height:${p.pctRemaining}%"></div>
        </div>
        <div class="day-volume-label">
          <span class="day-drain-left">${fmtUntilMidnight()}</span>
          <span class="day-drain-sublabel">until midnight</span>
        </div>
        <div class="day-stats">
          <div class="day-stat">
            <span class="day-stat-val">${fmtDur(p.remainingMinutes)}</span>
            <span class="day-stat-key">remaining</span>
          </div>
          <div class="day-stat day-stat-lost">
            <span class="day-stat-val">${fmtDur(p.elapsedMinutes)}</span>
            <span class="day-stat-key">gone today</span>
          </div>
        </div>
      </div>
      <div class="day-timeline">
        <div class="day-timeline-bar">
          <div class="day-timeline-lost" style="width:${p.pctElapsed}%"></div>
          <div class="day-timeline-now" style="left:${nowPct}%"></div>
        </div>
        <div class="day-timeline-ticks">
          <span>12a</span><span>6a</span><span>12p</span><span>6p</span><span>12a</span>
        </div>
      </div>
      <p class="hint">Resets at midnight · ${Math.round(p.pctRemaining)}% of today left</p>
    </div>`;
}

function updateDayDisplay() {
  const p = dayProgress();
  const nowPct = (p.hourOfDay / 24) * 100;
  const left = document.querySelector('.day-drain-left');
  const fill = document.querySelector('.day-volume-fill');
  const lost = document.querySelector('.day-timeline-lost');
  const now = document.querySelector('.day-timeline-now');
  const remVal = document.querySelector('.day-stat:not(.day-stat-lost) .day-stat-val');
  const goneVal = document.querySelector('.day-stat-lost .day-stat-val');
  const hint = document.querySelector('.day-drain .hint');
  if (left) left.textContent = fmtUntilMidnight();
  if (fill) fill.style.height = `${p.pctRemaining}%`;
  if (lost) lost.style.width = `${p.pctElapsed}%`;
  if (now) now.style.left = `${nowPct}%`;
  if (remVal) remVal.textContent = fmtDur(p.remainingMinutes);
  if (goneVal) goneVal.textContent = fmtDur(p.elapsedMinutes);
  if (hint) hint.textContent = `Resets at midnight · ${Math.round(p.pctRemaining)}% of today left`;
}

function donut(slices, size = 160, stroke = 24, centerLabel, centerSub) {
  const total = slices.reduce((s, x) => s + x.value, 0);
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const cx = size / 2;
  let off = 0;
  let arcs = '';
  if (total > 0) {
    for (const sl of slices) {
      const dash = (sl.value / total) * c;
      arcs += `<circle cx="${cx}" cy="${cx}" r="${r}" fill="none" stroke="${sl.color}" stroke-width="${stroke}" stroke-dasharray="${dash} ${c - dash}" stroke-dashoffset="${-off}" />`;
      off += dash;
    }
  }
  return `
    <div class="donut-wrap" style="width:${size}px;height:${size}px">
      <svg width="${size}" height="${size}" style="transform:rotate(-90deg)">
        <circle cx="${cx}" cy="${cx}" r="${r}" fill="none" stroke="rgba(255,255,255,0.08)" stroke-width="${stroke}" />
        ${arcs}
      </svg>
      <div class="donut-center">
        ${centerLabel ? `<span class="big">${centerLabel}</span>` : ''}
        ${centerSub ? `<span class="small">${centerSub}</span>` : ''}
      </div>
    </div>`;
}

function legend(slices) {
  return `<div class="legend">${slices.map((s) => `
    <div class="legend-row"><span class="legend-dot" style="background:${s.color}"></span>${s.label}</div>
  `).join('')}</div>`;
}

function bars(items, max) {
  const m = max ?? Math.max(...items.map((b) => b.value), 1);
  return `<div class="bars">${items.map((b) => {
    const pct = m > 0 ? b.value / m : 0;
    const h = Math.max(pct * 100, b.value > 0 ? 4 : 0);
    return `<div class="bar-col">
      <span class="bar-val">${b.value > 0 ? b.value.toFixed(1) : ''}</span>
      <div class="bar-track"><div class="bar-fill" style="height:${h}%;background:${b.color || 'var(--accent)'}"></div></div>
      <span class="bar-label">${b.label}</span>
      ${b.sub ? `<span class="bar-sub">${b.sub}</span>` : ''}
    </div>`;
  }).join('')}</div>`;
}

function renderLogList(logs, emptyMsg) {
  if (!logs.length) return `<p class="empty">${emptyMsg}</p>`;
  return `<div class="list">${[...logs].reverse().map((log) => {
    const a = state.activities.find((x) => x.id === log.activityId);
    return `<div class="log-row">
      <span class="log-dot" style="background:${a?.color}"></span>
      <span class="log-name">${a?.name ?? 'Unknown'}</span>
      <span class="log-dur">${fmtDur(log.durationMinutes)}</span>
      <button class="log-del" data-del="${log.id}">×</button>
    </div>`;
  }).join('')}</div>`;
}

function renderToday() {
  const t = today();
  const logs = state.logs.filter((l) => l.date === t);
  const running = !!state.activeTimer;
  const act = state.activities.find((a) => a.id === (running ? state.activeTimer.activityId : selectedId));

  const goals = state.activities.map((a) => {
    const done = logs.filter((l) => l.activityId === a.id).reduce((s, l) => s + l.durationMinutes, 0);
    return { label: a.name.slice(0, 3), value: toHours(done), color: a.color, sub: `${Math.min(100, Math.round((done / a.targetMinutes) * 100))}%` };
  });

  return `
    <p class="page-date">${fmtDate(new Date())}</p>

    <div class="section section-first">
      <h2 class="headline">Focus timer</h2>
      <p class="headline-sub timer-sub">${running && act ? act.name : "Choose what you're working on"}</p>
      <div class="timer-block">
        <div class="timer-time">${fmtTimer(elapsed())}</div>
        ${!running ? `<div class="chips">${state.activities.map((a) => `
          <button class="chip ${selectedId === a.id ? 'selected' : ''}" style="--c:${a.color}" data-select="${a.id}">
            <span class="chip-dot" style="--c:${a.color}"></span>${a.name}
          </button>`).join('')}</div>` : ''}
        <button class="btn ${running ? 'btn-stop' : 'btn-start'}" id="timer-btn" ${!running && !selectedId ? 'disabled' : ''}>
          ${running ? 'Stop' : 'Start'}
        </button>
      </div>
    </div>

    <div class="section">
      <h2 class="headline">Time left today</h2>
      <p class="headline-sub">The day drains. Midnight resets the clock.</p>
      ${dayDrain()}
    </div>

    <div class="section">
      <h2 class="headline">Daily goals</h2>
      <p class="headline-sub">Progress toward what matters.</p>
      ${bars(goals, 4)}
    </div>

    <div class="section">
      <h2 class="headline">Today</h2>
      <div class="list">
      ${state.checklist.map((item) => {
        const done = item.completedDates.includes(t);
        return `<button class="check-row ${done ? 'done' : ''}" data-check="${item.id}">
          <span class="check-box">${CHECK_SVG}</span>
          <span class="check-title">${item.title}</span>
        </button>`;
      }).join('')}
      </div>
    </div>`;
}

function renderWeek() {
  const dates = weekDates();
  const t = today();
  const daily = dates.map((d) => {
    const mins = state.logs.filter((l) => l.date === d).reduce((s, l) => s + l.durationMinutes, 0);
    return { label: dayLabel(d), value: toHours(mins), color: d === t ? '#f5f5f7' : '#0071e3', sub: d === t ? 'today' : '' };
  });

  const map = {};
  for (const log of state.logs) {
    if (!dates.includes(log.date)) continue;
    map[log.activityId] = (map[log.activityId] ?? 0) + log.durationMinutes;
  }
  const breakdown = state.activities.map((a) => ({
    value: map[a.id] ?? 0,
    color: a.color,
    label: `${a.name} · ${fmtDur(map[a.id] ?? 0)}`,
  })).filter((s) => s.value > 0);
  const weekTotal = breakdown.reduce((s, b) => s + b.value, 0);

  let done = 0, total = 0;
  for (const d of dates) {
    for (const item of state.checklist) {
      total++;
      if (item.completedDates.includes(d)) done++;
    }
  }

  return `
    <p class="page-date">This week</p>

    <div class="section section-first">
      <h2 class="headline">Your week</h2>
      <p class="headline-sub">${done}/${total} habits completed</p>
    </div>

    <div class="section">
      <h2 class="headline">Hours per day</h2>
      <p class="headline-sub">${toHours(daily.reduce((s, b) => s + b.value * 60, 0))} hours tracked</p>
      ${bars(daily)}
    </div>

    <div class="section">
      <h2 class="headline">By activity</h2>
      <p class="headline-sub">Where your time went.</p>
      ${breakdown.length ? `<div class="chart-row">
        ${donut(breakdown, 160, 20, fmtDur(weekTotal), 'this week')}
        ${legend(breakdown)}
      </div>` : '<p class="empty">No activity logged this week yet</p>'}
    </div>

    <div class="section">
      <h2 class="headline">Goal progress</h2>
      <p class="headline-sub">Seven-day targets.</p>
      ${state.activities.map((a) => {
        const mins = state.logs.filter((l) => dates.includes(l.date) && l.activityId === a.id).reduce((s, l) => s + l.durationMinutes, 0);
        const target = a.targetMinutes * 7;
        const pct = Math.min(100, Math.round((mins / target) * 100));
        return `<div class="goal-row">
          <div class="goal-header">
            <span class="legend-dot" style="background:${a.color}"></span>
            <span class="goal-name">${a.name}</span>
            <span class="goal-pct">${pct}%</span>
          </div>
          <div class="goal-track"><div class="goal-fill" style="width:${pct}%;background:${a.color}"></div></div>
          <div class="goal-sub">${fmtDur(mins)} / ${fmtDur(target)}</div>
        </div>`;
      }).join('')}
    </div>`;
}

function renderGoals() {
  const t = today();
  const todayLogs = state.logs.filter((l) => l.date === t);

  return `
    <div class="section section-first">
      <h2 class="headline">Quick log</h2>
      <p class="headline-sub">Add time without the timer.</p>
      <span class="label">Activity</span>
      <div class="chips" id="manual-chips">
        ${state.activities.map((a) => `
          <button class="chip ${(selectedId === a.id) ? 'selected' : ''}" style="--c:${a.color}" data-manual="${a.id}">
            <span class="chip-dot" style="--c:${a.color}"></span>${a.name}
          </button>`).join('')}
      </div>
      <span class="label">Minutes</span>
      <input class="input" id="manual-mins" type="number" inputmode="numeric" value="30" />
      <button class="btn btn-start btn-full" id="manual-log">Log time</button>
    </div>

    <div class="section">
      <h2 class="headline">Today's log</h2>
      <p class="headline-sub">Tap × to remove an entry.</p>
      ${renderLogList(todayLogs, 'No entries yet today')}
    </div>

    <div class="section">
      <h2 class="headline">Activities</h2>
      ${state.activities.map((a) => `
        <div class="activity-block">
          <div class="activity-header">
            <span class="legend-dot" style="background:${a.color}"></span>
            <span class="activity-name">${a.name}</span>
            <button class="trash" data-rm-act="${a.id}">Remove</button>
          </div>
          <span class="label">Daily target</span>
          <div class="target-row">
            ${[30, 60, 120, 240].map((m) => `
              <button class="target-chip ${a.targetMinutes === m ? 'active' : ''}" data-target="${a.id}:${m}">
                ${m < 60 ? `${m}m` : `${m / 60}h`}
              </button>`).join('')}
          </div>
        </div>`).join('')}
      <div class="add-row">
        <input class="input" id="new-act" placeholder="New activity..." />
        <button class="icon-btn" id="add-act">+</button>
      </div>
    </div>

    <div class="section">
      <h2 class="headline">Habits</h2>
      <div class="list">
        ${state.checklist.map((item) => `
          <div class="static-row">
            <span>${item.title}</span>
            <button class="trash" data-rm-check="${item.id}">Remove</button>
          </div>`).join('')}
      </div>
      <div class="add-row">
        <input class="input" id="new-check" placeholder="New daily habit..." />
        <button class="icon-btn" id="add-check">+</button>
      </div>
    </div>`;
}

function render() {
  const screen = document.getElementById('screen');
  if (tab === 'today') screen.innerHTML = renderToday();
  else if (tab === 'week') screen.innerHTML = renderWeek();
  else screen.innerHTML = renderGoals();
  screen.scrollTop = 0;
  updateTopbarVisibility();
  bind();
  startTick();
}

function selectActivity(id) {
  selectedId = id;
  document.querySelectorAll('[data-select]').forEach((el) => {
    el.classList.toggle('selected', el.dataset.select === id);
  });
  document.querySelectorAll('[data-manual]').forEach((el) => {
    el.classList.toggle('selected', el.dataset.manual === id);
  });
  const btn = document.getElementById('timer-btn');
  if (btn) btn.disabled = !id;
}

function updateTopbarVisibility() {
  const screen = document.getElementById('screen');
  const topbar = document.querySelector('.topbar');
  if (!screen || !topbar) return;
  topbar.classList.toggle('hidden', screen.scrollTop > 20);
}

function bind() {
  document.querySelectorAll('[data-select]').forEach((el) => {
    el.onclick = () => selectActivity(el.dataset.select);
  });
  document.querySelectorAll('[data-manual]').forEach((el) => {
    el.onclick = () => selectActivity(el.dataset.manual);
  });

  const timerBtn = document.getElementById('timer-btn');
  if (timerBtn) {
    timerBtn.onclick = () => {
      if (state.activeTimer) {
        const end = Date.now();
        const mins = Math.max(1, Math.round((end - state.activeTimer.startedAt) / 60000));
        state.logs.push({
          id: id(),
          activityId: state.activeTimer.activityId,
          startTime: state.activeTimer.startedAt,
          endTime: end,
          durationMinutes: mins,
          date: today(),
        });
        state.activeTimer = null;
      } else if (selectedId) {
        state.activeTimer = { activityId: selectedId, startedAt: Date.now() };
      }
      save();
      render();
    };
  }

  document.querySelectorAll('[data-check]').forEach((el) => {
    el.onclick = () => {
      const item = state.checklist.find((c) => c.id === el.dataset.check);
      const t = today();
      if (item.completedDates.includes(t)) {
        item.completedDates = item.completedDates.filter((d) => d !== t);
      } else {
        item.completedDates.push(t);
      }
      save();
      render();
    };
  });

  document.querySelectorAll('[data-del]').forEach((el) => {
    el.onclick = () => {
      state.logs = state.logs.filter((l) => l.id !== el.dataset.del);
      save();
      render();
    };
  });

  const manualLog = document.getElementById('manual-log');
  if (manualLog) {
    manualLog.onclick = () => {
      const mins = parseInt(document.getElementById('manual-mins').value, 10);
      if (!selectedId || !mins || mins <= 0) return;
      const now = Date.now();
      state.logs.push({
        id: id(),
        activityId: selectedId,
        startTime: now - mins * 60000,
        endTime: now,
        durationMinutes: mins,
        date: today(),
      });
      save();
      render();
    };
  }

  document.getElementById('add-act')?.addEventListener('click', () => {
    const input = document.getElementById('new-act');
    const name = input.value.trim();
    if (!name) return;
    state.activities.push({
      id: id(),
      name,
      color: COLORS[state.activities.length % COLORS.length],
      targetMinutes: 60,
    });
    input.value = '';
    save();
    render();
  });

  document.getElementById('add-check')?.addEventListener('click', () => {
    const input = document.getElementById('new-check');
    const title = input.value.trim();
    if (!title) return;
    state.checklist.push({ id: id(), title, completedDates: [] });
    input.value = '';
    save();
    render();
  });

  document.querySelectorAll('[data-rm-act]').forEach((el) => {
    el.onclick = () => {
      state.activities = state.activities.filter((a) => a.id !== el.dataset.rmAct);
      save();
      render();
    };
  });

  document.querySelectorAll('[data-rm-check]').forEach((el) => {
    el.onclick = () => {
      state.checklist = state.checklist.filter((c) => c.id !== el.dataset.rmCheck);
      save();
      render();
    };
  });

  document.querySelectorAll('[data-target]').forEach((el) => {
    el.onclick = () => {
      const [aid, mins] = el.dataset.target.split(':');
      const a = state.activities.find((x) => x.id === aid);
      if (a) a.targetMinutes = parseInt(mins, 10);
      save();
      render();
    };
  });
}

document.querySelectorAll('.bottom-tab').forEach((btn) => {
  btn.onclick = () => {
    const next = btn.dataset.tab;
    if (next === tab) return;
    tab = next;
    document.querySelectorAll('.bottom-tab').forEach((b) => b.classList.toggle('active', b === btn));
    render();
  };
});

let scrollPending = false;
document.getElementById('screen')?.addEventListener('scroll', () => {
  if (scrollPending) return;
  scrollPending = true;
  requestAnimationFrame(() => {
    updateTopbarVisibility();
    scrollPending = false;
  });
}, { passive: true });

function initDisplayMode() {
  const standalone =
    window.navigator.standalone === true ||
    window.matchMedia('(display-mode: standalone)').matches;
  document.documentElement.classList.toggle('standalone', standalone);
}

initDisplayMode();

if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('./sw.js', { scope: './' }).catch(() => {});
}

render();
