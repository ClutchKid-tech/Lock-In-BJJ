// ═══════════════════════════════════════════════════════
//  LOCK IN BJJ — Gamification Module
//  Adds: Mat Hours Levels, Solo Drill Library, Leaderboard
// ═══════════════════════════════════════════════════════

// ── Level System ─────────────────────────────────────
const LEVELS = [
  { level: 1,  name: "White Belt",  stripe: 0, minMin: 0,     color: "#e8e8f0", glow: "rgba(232,232,240,0.3)" },
  { level: 2,  name: "White Belt",  stripe: 1, minMin: 300,   color: "#e8e8f0", glow: "rgba(232,232,240,0.3)" },
  { level: 3,  name: "White Belt",  stripe: 2, minMin: 600,   color: "#e8e8f0", glow: "rgba(232,232,240,0.3)" },
  { level: 4,  name: "White Belt",  stripe: 3, minMin: 900,   color: "#e8e8f0", glow: "rgba(232,232,240,0.3)" },
  { level: 5,  name: "White Belt",  stripe: 4, minMin: 1200,  color: "#e8e8f0", glow: "rgba(232,232,240,0.3)" },
  { level: 6,  name: "Blue Belt",   stripe: 0, minMin: 1800,  color: "#4361ee", glow: "rgba(67,97,238,0.4)"   },
  { level: 7,  name: "Blue Belt",   stripe: 1, minMin: 2700,  color: "#4361ee", glow: "rgba(67,97,238,0.4)"   },
  { level: 8,  name: "Blue Belt",   stripe: 2, minMin: 3600,  color: "#4361ee", glow: "rgba(67,97,238,0.4)"   },
  { level: 9,  name: "Blue Belt",   stripe: 3, minMin: 4500,  color: "#4361ee", glow: "rgba(67,97,238,0.4)"   },
  { level: 10, name: "Blue Belt",   stripe: 4, minMin: 5400,  color: "#4361ee", glow: "rgba(67,97,238,0.4)"   },
  { level: 11, name: "Purple Belt", stripe: 0, minMin: 7200,  color: "#9b5de5", glow: "rgba(155,93,229,0.4)"  },
  { level: 12, name: "Purple Belt", stripe: 1, minMin: 9000,  color: "#9b5de5", glow: "rgba(155,93,229,0.4)"  },
  { level: 13, name: "Purple Belt", stripe: 2, minMin: 10800, color: "#9b5de5", glow: "rgba(155,93,229,0.4)"  },
  { level: 14, name: "Purple Belt", stripe: 3, minMin: 12600, color: "#9b5de5", glow: "rgba(155,93,229,0.4)"  },
  { level: 15, name: "Purple Belt", stripe: 4, minMin: 14400, color: "#9b5de5", glow: "rgba(155,93,229,0.4)"  },
  { level: 16, name: "Brown Belt",  stripe: 0, minMin: 18000, color: "#a0522d", glow: "rgba(160,82,45,0.4)"   },
  { level: 17, name: "Brown Belt",  stripe: 1, minMin: 21600, color: "#a0522d", glow: "rgba(160,82,45,0.4)"   },
  { level: 18, name: "Brown Belt",  stripe: 2, minMin: 25200, color: "#a0522d", glow: "rgba(160,82,45,0.4)"   },
  { level: 19, name: "Brown Belt",  stripe: 3, minMin: 28800, color: "#a0522d", glow: "rgba(160,82,45,0.4)"   },
  { level: 20, name: "Black Belt",  stripe: 1, minMin: 36000, color: "#1a1a1a", glow: "rgba(230,57,70,0.5)"   },
];

function getTotalMinutes() {
  const sessions = Store.sessions();
  return sessions.reduce((total, s) => {
    if (s.duration) return total + parseInt(s.duration);
    // Estimate: 5 min per round + 15 min base
    return total + 15 + ((s.rounds || []).length * 5);
  }, 0);
}

function getCurrentLevel(totalMin) {
  let current = LEVELS[0];
  for (const lvl of LEVELS) {
    if (totalMin >= lvl.minMin) current = lvl;
    else break;
  }
  return current;
}

function getNextLevel(currentLevel) {
  return LEVELS.find(l => l.level === currentLevel.level + 1) || null;
}

function getLevelProgress(totalMin, current, next) {
  if (!next) return 100;
  const range = next.minMin - current.minMin;
  const progress = totalMin - current.minMin;
  return Math.min(100, Math.round((progress / range) * 100));
}

function renderRankScreen() {
  const totalMin = getTotalMinutes();
  const totalHours = (totalMin / 60).toFixed(1);
  const current = getCurrentLevel(totalMin);
  const next = getNextLevel(current);
  const progress = getLevelProgress(totalMin, current, next);
  const minToNext = next ? Math.max(0, next.minMin - totalMin) : 0;
  const hoursToNext = (minToNext / 60).toFixed(1);
  const sessions = Store.sessions().length;

  // Belt display
  const stripeHTML = Array.from({ length: 4 }, (_, i) =>
    `<div class="stripe ${i < current.stripe ? 'stripe-filled' : ''}"></div>`
  ).join('');

  $('#rank-belt-bar').style.background = current.color;
  $('#rank-belt-bar').style.boxShadow = `0 0 24px ${current.glow}`;
  $('#rank-stripes').innerHTML = stripeHTML;
  $('#rank-belt-name').textContent = current.name;
  $('#rank-level-num').textContent = `Level ${current.level}`;
  $('#rank-total-hours').textContent = totalHours;
  $('#rank-total-sessions').textContent = sessions;
  $('#rank-progress-bar').style.width = `${progress}%`;
  $('#rank-progress-bar').style.background = next ? next.color : current.color;
  $('#rank-progress-bar').style.boxShadow = `0 0 12px ${next ? next.glow : current.glow}`;
  $('#rank-progress-pct').textContent = `${progress}%`;

  if (next) {
    $('#rank-next-label').textContent = `Next: ${next.name} ${next.stripe > 0 ? next.stripe + ' stripe' : ''}`;
    $('#rank-hours-to-next').textContent = `${hoursToNext} hrs to go`;
  } else {
    $('#rank-next-label').textContent = 'Max Rank Achieved';
    $('#rank-hours-to-next').textContent = '🥋 Legend';
  }

  // Milestones
  const milestoneHTML = LEVELS.map(lvl => {
    const reached = totalMin >= lvl.minMin;
    const isCurrent = lvl.level === current.level;
    return `
      <div class="milestone-item ${reached ? 'reached' : ''} ${isCurrent ? 'current' : ''}">
        <div class="milestone-dot" style="${reached ? `background:${lvl.color};box-shadow:0 0 10px ${lvl.glow}` : ''}"></div>
        <div class="milestone-info">
          <span class="milestone-name">${lvl.name} ${lvl.stripe > 0 ? '— ' + lvl.stripe + ' stripe' : ''}</span>
          <span class="milestone-req">${(lvl.minMin / 60).toFixed(0)} hrs</span>
        </div>
        ${isCurrent ? '<span class="milestone-you">YOU</span>' : ''}
        ${reached && !isCurrent ? '<span class="milestone-check">✓</span>' : ''}
      </div>`;
  }).join('');
  $('#milestone-list').innerHTML = milestoneHTML;
}

// ── Drill Library ─────────────────────────────────────
const DRILLS = [
  // Mobility
  { id: 'shrimp',      cat: 'Mobility',   name: 'Shrimping',            desc: 'Hip escape drill across the mat and back. Core BJJ movement.',         duration: 60  },
  { id: 'granby',      cat: 'Mobility',   name: 'Granby Roll',          desc: 'Shoulder roll to invert. Essential for guard recovery.',                duration: 60  },
  { id: 'sitout',      cat: 'Mobility',   name: 'Sit-Out',              desc: 'Base movement for turtle escapes and scrambles.',                       duration: 60  },
  { id: 'bridgebump',  cat: 'Mobility',   name: 'Bridge & Bump',        desc: 'Hip bridge with explosive hip drive. Escape foundation.',               duration: 45  },
  { id: 'hipswitch',   cat: 'Mobility',   name: 'Hip Switch',           desc: 'Alternate hip loading for guard retention and attacks.',                duration: 60  },
  { id: 'technical',   cat: 'Mobility',   name: 'Technical Stand-Up',   desc: 'Safe stand-up from guard. Base + post + rise.',                        duration: 45  },

  // Strength
  { id: 'gripsq',      cat: 'Strength',   name: 'Grip Squeezes',        desc: 'Squeeze towel or gi for 3 sec holds. Grip endurance builder.',          duration: 90  },
  { id: 'nekbridge',   cat: 'Strength',   name: 'Neck Bridges',         desc: 'Slow neck circles and isometric holds. Protect against chokes.',        duration: 60  },
  { id: 'bearwalk',    cat: 'Strength',   name: 'Bear Walk',            desc: 'Quadruped locomotion. Hip mobility + core stability.',                  duration: 60  },
  { id: 'wrestler',    cat: 'Strength',   name: 'Wrestler Sit-Outs',    desc: 'Explosive base change from all-fours. Functional BJJ strength.',        duration: 45  },
  { id: 'pushup',      cat: 'Strength',   name: 'Combat Base Push-Ups', desc: 'Push-ups from combat base position. Chest + core.',                    duration: 60  },
  { id: 'sqthrust',    cat: 'Strength',   name: 'Sprawl + Base',        desc: 'Sprawl to base position alternating. Hip flexor + defence.',           duration: 60  },

  // Technique
  { id: 'armbar',      cat: 'Technique',  name: 'Armbar Entry',         desc: 'Mount to armbar rep drill. Hip mount and pivot.',                      duration: 90  },
  { id: 'triangle',    cat: 'Technique',  name: 'Triangle Entry',       desc: 'Guard to triangle setup. Angle and leg positioning.',                  duration: 90  },
  { id: 'guardpass',   cat: 'Technique',  name: 'Torreando Pass',       desc: 'Standing guard pass. Grip + redirect + knee cut.',                     duration: 90  },
  { id: 'sweepsingle', cat: 'Technique',  name: 'Single Leg Sweep',     desc: 'Basic single leg hook sweep from closed guard.',                       duration: 90  },
  { id: 'kimura',      cat: 'Technique',  name: 'Kimura Grip Entry',    desc: 'Kimura entry from side control. Figure-four reps.',                    duration: 60  },
  { id: 'backtake',    cat: 'Technique',  name: 'Back Take Series',     desc: 'Turtle back take with seatbelt. Hooks in and flatten.',                duration: 120 },
  { id: 'guillotine',  cat: 'Technique',  name: 'Guillotine Defense',   desc: 'Posture break and arm clear drill against guillotine.',                duration: 60  },
  { id: 'xguard',      cat: 'Technique',  name: 'X-Guard Entry',        desc: 'Butterfly to X-guard transition. Knee shield to hook.',               duration: 90  },
];

let activeDrillId = null;
let drillTimerInterval = null;
let drillTimeLeft = 0;
let drillTotalTime = 0;
let drillFilter = 'All';

function renderDrillScreen() {
  renderDrillCards();
  setupDrillFilters();
}

function setupDrillFilters() {
  $$('.drill-filter-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      $$('.drill-filter-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      drillFilter = btn.dataset.cat;
      renderDrillCards();
    });
  });
}

function renderDrillCards() {
  const filtered = drillFilter === 'All' ? DRILLS : DRILLS.filter(d => d.cat === drillFilter);
  const catColors = { Mobility: '#2ec4b6', Strength: '#e63946', Technique: '#4361ee' };

  $('#drill-grid').innerHTML = filtered.map(d => `
    <div class="drill-card" data-id="${d.id}">
      <div class="drill-cat-tag" style="color:${catColors[d.cat]};border-color:${catColors[d.cat]}20;background:${catColors[d.cat]}10">${d.cat}</div>
      <div class="drill-name">${d.name}</div>
      <div class="drill-desc">${d.desc}</div>
      <div class="drill-footer">
        <span class="drill-duration">⏱ ${d.duration}s</span>
        <button class="drill-start-btn" data-id="${d.id}">Start</button>
      </div>
    </div>
  `).join('');

  $$('.drill-start-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      openDrillTimer(btn.dataset.id);
    });
  });
}

function openDrillTimer(id) {
  const drill = DRILLS.find(d => d.id === id);
  if (!drill) return;

  activeDrillId = id;
  drillTimeLeft = drill.duration;
  drillTotalTime = drill.duration;

  $('#timer-drill-name').textContent = drill.name;
  $('#timer-drill-desc').textContent = drill.desc;
  updateTimerDisplay();
  updateTimerRing();

  $('#drill-timer-modal').classList.remove('hidden');
  $('#drill-timer-modal').classList.add('visible');
}

function closeDrillTimer() {
  clearInterval(drillTimerInterval);
  drillTimerInterval = null;
  $('#drill-timer-modal').classList.remove('visible');
  setTimeout(() => $('#drill-timer-modal').classList.add('hidden'), 300);
  $('#timer-start-btn').textContent = 'Start';
  $('#timer-start-btn').dataset.state = 'idle';
}

function updateTimerDisplay() {
  const m = Math.floor(drillTimeLeft / 60);
  const s = drillTimeLeft % 60;
  $('#timer-display').textContent = m > 0
    ? `${m}:${String(s).padStart(2, '0')}`
    : String(drillTimeLeft);
}

function updateTimerRing() {
  const pct = drillTotalTime > 0 ? drillTimeLeft / drillTotalTime : 0;
  const circumference = 2 * Math.PI * 54;
  const offset = circumference * (1 - pct);
  const ring = document.getElementById('timer-ring');
  if (ring) {
    ring.style.strokeDasharray = circumference;
    ring.style.strokeDashoffset = offset;
  }
}

function startDrillTimer() {
  const btn = $('#timer-start-btn');
  if (btn.dataset.state === 'running') {
    clearInterval(drillTimerInterval);
    drillTimerInterval = null;
    btn.textContent = 'Resume';
    btn.dataset.state = 'paused';
    return;
  }

  btn.textContent = 'Pause';
  btn.dataset.state = 'running';

  drillTimerInterval = setInterval(() => {
    drillTimeLeft--;
    updateTimerDisplay();
    updateTimerRing();

    if (drillTimeLeft <= 0) {
      clearInterval(drillTimerInterval);
      drillTimerInterval = null;
      btn.textContent = 'Done!';
      btn.dataset.state = 'done';
      document.getElementById('timer-display').textContent = '✓';
      document.getElementById('timer-ring').style.stroke = '#2ec4b6';
      // Log completed drill
      logCompletedDrill(activeDrillId);
    }
  }, 1000);
}

function resetDrillTimer() {
  clearInterval(drillTimerInterval);
  drillTimerInterval = null;
  const drill = DRILLS.find(d => d.id === activeDrillId);
  if (drill) {
    drillTimeLeft = drill.duration;
    drillTotalTime = drill.duration;
    updateTimerDisplay();
    updateTimerRing();
  }
  document.getElementById('timer-ring').style.stroke = '';
  $('#timer-start-btn').textContent = 'Start';
  $('#timer-start-btn').dataset.state = 'idle';
}

function logCompletedDrill(id) {
  const completed = JSON.parse(localStorage.getItem('bjj_completed_drills') || '[]');
  completed.push({ id, completedAt: new Date().toISOString() });
  localStorage.setItem('bjj_completed_drills', JSON.stringify(completed));

  const drill = DRILLS.find(d => d.id === id);
  const count = completed.filter(c => c.id === id).length;
  $('#timer-complete-msg').textContent = `${drill.name} completed × ${count} total`;
  $('#timer-complete-msg').classList.remove('hidden');
}

// ── Leaderboard ──────────────────────────────────────
const MOCK_USERS = [
  { name: "Romulo_BJJ",     belt: "Purple Belt", streak: 47, avatar: "R" },
  { name: "GuardPasser99",  belt: "Blue Belt",   streak: 34, avatar: "G" },
  { name: "BerimbologX",    belt: "Brown Belt",  streak: 29, avatar: "B" },
  { name: "NeckCrank_Neil", belt: "White Belt",  streak: 26, avatar: "N" },
  { name: "ToeHoldTara",    belt: "Purple Belt", streak: 22, avatar: "T" },
  { name: "DarceDevil",     belt: "Blue Belt",   streak: 19, avatar: "D" },
  { name: "ScrambleKing",   belt: "Brown Belt",  streak: 16, avatar: "S" },
  { name: "OmoPlataQueen",  belt: "Blue Belt",   streak: 14, avatar: "O" },
  { name: "KashansiFlow",   belt: "Purple Belt", streak: 11, avatar: "K" },
  { name: "GallowsGrip",    belt: "White Belt",  streak: 8,  avatar: "G" },
  { name: "HeelhookHero",   belt: "Blue Belt",   streak: 6,  avatar: "H" },
  { name: "GuillotineGuy",  belt: "White Belt",  streak: 4,  avatar: "G" },
];

const BELT_COLORS = {
  "White Belt":  "#e8e8f0",
  "Blue Belt":   "#4361ee",
  "Purple Belt": "#9b5de5",
  "Brown Belt":  "#a0522d",
  "Black Belt":  "#1a1a1a",
};

function calcCurrentStreak() {
  const sessions = Store.sessions().sort((a, b) => b.date.localeCompare(a.date));
  if (!sessions.length) return 0;
  const dates = [...new Set(sessions.map(s => s.date))].sort((a, b) => b.localeCompare(a));
  const today = todayStr();
  const yest = (() => { const d = new Date(); d.setDate(d.getDate() - 1); return d.getFullYear() + '-' + String(d.getMonth()+1).padStart(2,'0') + '-' + String(d.getDate()).padStart(2,'0'); })();
  if (dates[0] !== today && dates[0] !== yest) return 0;
  let streak = 1;
  for (let i = 0; i < dates.length - 1; i++) {
    const diff = (new Date(dates[i] + 'T00:00:00') - new Date(dates[i+1] + 'T00:00:00')) / 86400000;
    if (diff === 1) streak++;
    else break;
  }
  return streak;
}

function renderLeaderboard() {
  const myStreak = calcCurrentStreak();
  const totalMin = getTotalMinutes();
  const myLevel = getCurrentLevel(totalMin);

  const myEntry = {
    name: localStorage.getItem('bjj_username') || 'You',
    belt: myLevel.name,
    streak: myStreak,
    avatar: (localStorage.getItem('bjj_username') || 'Y')[0].toUpperCase(),
    isMe: true,
  };

  const allUsers = [...MOCK_USERS.map(u => ({ ...u, isMe: false })), myEntry]
    .sort((a, b) => b.streak - a.streak);

  const myRank = allUsers.findIndex(u => u.isMe) + 1;

  $('#my-rank-num').textContent = `#${myRank}`;
  $('#my-streak-val').textContent = `${myStreak} day${myStreak !== 1 ? 's' : ''}`;
  $('#my-belt-val').textContent = myLevel.name;

  const medalMap = { 1: '🥇', 2: '🥈', 3: '🥉' };

  $('#leaderboard-list').innerHTML = allUsers.map((user, idx) => {
    const rank = idx + 1;
    const beltColor = BELT_COLORS[user.belt] || '#888';
    const isTop3 = rank <= 3;
    return `
      <div class="lb-row ${user.isMe ? 'lb-me' : ''} ${isTop3 ? 'lb-top3' : ''}">
        <div class="lb-rank">${medalMap[rank] || rank}</div>
        <div class="lb-avatar" style="background:${beltColor}20;color:${beltColor};border-color:${beltColor}40">${user.avatar}</div>
        <div class="lb-user">
          <span class="lb-name">${user.name}${user.isMe ? ' (You)' : ''}</span>
          <span class="lb-belt" style="color:${beltColor}">${user.belt}</span>
        </div>
        <div class="lb-streak">
          <span class="lb-streak-num">${user.streak}</span>
          <span class="lb-streak-label">days</span>
        </div>
      </div>`;
  }).join('');

  // Streak chart — last 14 days
  renderStreakChart();
}

function renderStreakChart() {
  const sessions = Store.sessions();
  const sessionDates = new Set(sessions.map(s => s.date));
  const days = [];
  for (let i = 13; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const str = d.getFullYear() + '-' + String(d.getMonth()+1).padStart(2,'0') + '-' + String(d.getDate()).padStart(2,'0');
    days.push({ str, trained: sessionDates.has(str), dayLabel: d.toLocaleDateString('en', { weekday: 'narrow' }) });
  }

  $('#streak-chart').innerHTML = days.map(d => `
    <div class="chart-day">
      <div class="chart-bar ${d.trained ? 'chart-bar-filled' : ''}" title="${d.str}"></div>
      <div class="chart-label">${d.dayLabel}</div>
    </div>
  `).join('');
}

// ── Username Setup ────────────────────────────────────
function initUsernamePrompt() {
  const existing = localStorage.getItem('bjj_username');
  if (existing) {
    $('#username-setup').classList.add('hidden');
    $('#leaderboard-content').classList.remove('hidden');
  } else {
    $('#username-setup').classList.remove('hidden');
    $('#leaderboard-content').classList.add('hidden');
  }
}

$('#username-form').addEventListener('submit', (e) => {
  e.preventDefault();
  const val = $('#username-input').value.trim();
  if (!val) return;
  localStorage.setItem('bjj_username', val);
  $('#username-setup').classList.add('hidden');
  $('#leaderboard-content').classList.remove('hidden');
  renderLeaderboard();
});

// ── Screen Navigation ─────────────────────────────────
// Extend existing showScreen to handle new screens
const _originalShowScreen = showScreen;
window.showScreen = function(name) {
  _originalShowScreen(name);
  if (name === 'rank') renderRankScreen();
  if (name === 'drills') renderDrillScreen();
  if (name === 'leaderboard') { initUsernamePrompt(); renderLeaderboard(); }
};

// New nav buttons
$$('.nav-btn').forEach(btn => {
  btn.addEventListener('click', () => showScreen(btn.dataset.screen));
});

// Drill timer modal events
$('#timer-start-btn').addEventListener('click', startDrillTimer);
$('#timer-reset-btn').addEventListener('click', resetDrillTimer);
$('#timer-close-btn').addEventListener('click', closeDrillTimer);

// ── Duration field in Log Session ────────────────────
// Patches the existing save handler to also capture duration
const _origLogForm = document.getElementById('log-form');
const _origSubmit = _origLogForm.onsubmit;

// Extend session save to include duration
document.getElementById('log-form').addEventListener('submit', () => {
  // Duration is patched in via the new input field
}, { capture: true });
