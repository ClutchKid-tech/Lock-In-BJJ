// ── Data Layer ──
const Store = {
  get(key) { return JSON.parse(localStorage.getItem(`bjj_${key}`) || '[]'); },
  set(key, val) { localStorage.setItem(`bjj_${key}`, JSON.stringify(val)); },
  sessions() { return this.get('sessions'); },
  saveSessions(s) { this.set('sessions', s); },
  comps() { return this.get('comps'); },
  saveComps(c) { this.set('comps', c); },
};

// ── Helpers ──
function $(sel) { return document.querySelector(sel); }
function $$(sel) { return document.querySelectorAll(sel); }
function genId() { return Date.now().toString(36) + Math.random().toString(36).slice(2, 6); }

function formatDate(str) {
  const d = new Date(str + 'T00:00:00');
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function daysUntil(dateStr) {
  const now = new Date(); now.setHours(0,0,0,0);
  const target = new Date(dateStr + 'T00:00:00');
  return Math.ceil((target - now) / (1000 * 60 * 60 * 24));
}

function todayStr() {
  const d = new Date();
  return d.getFullYear() + '-' + String(d.getMonth()+1).padStart(2,'0') + '-' + String(d.getDate()).padStart(2,'0');
}

// ── Navigation ──
let currentScreen = 'dashboard';
let isTransitioning = false;

function showScreen(name) {
  if (isTransitioning || name === currentScreen) {
    // Still update content even if same screen
    if (name === currentScreen) {
      if (name === 'dashboard') renderDashboard();
      if (name === 'progress') renderProgress();
      if (name === 'comp') renderComps();
    }
    if (name !== currentScreen && !isTransitioning) {
      // fallback: just swap
      $$('.screen').forEach(s => s.classList.remove('active', 'screen-out'));
      $(`#screen-${name}`).classList.add('active');
    }
    $$('.nav-btn').forEach(b => b.classList.toggle('active', b.dataset.screen === name));
    currentScreen = name;
    return;
  }

  const prev = $(`#screen-${currentScreen}`);
  const next = $(`#screen-${name}`);

  if (prev && prev !== next) {
    isTransitioning = true;
    prev.classList.add('screen-out');

    setTimeout(() => {
      prev.classList.remove('active', 'screen-out');
      next.classList.add('active');
      isTransitioning = false;
    }, 150);
  } else {
    $$('.screen').forEach(s => s.classList.remove('active'));
    next.classList.add('active');
  }

  $$('.nav-btn').forEach(b => b.classList.toggle('active', b.dataset.screen === name));
  currentScreen = name;

  if (name === 'dashboard') renderDashboard();
  if (name === 'progress') renderProgress();
  if (name === 'comp') renderComps();
}

$$('.nav-btn').forEach(btn => {
  btn.addEventListener('click', () => showScreen(btn.dataset.screen));
});

// ── Dashboard ──
function calcStreak() {
  const sessions = Store.sessions().sort((a,b) => b.date.localeCompare(a.date));
  if (!sessions.length) return 0;

  const dates = [...new Set(sessions.map(s => s.date))].sort((a,b) => b.localeCompare(a));
  const today = todayStr();
  const yesterday = new Date(); yesterday.setDate(yesterday.getDate()-1);
  const yesterdayStr = yesterday.getFullYear() + '-' + String(yesterday.getMonth()+1).padStart(2,'0') + '-' + String(yesterday.getDate()).padStart(2,'0');

  if (dates[0] !== today && dates[0] !== yesterdayStr) return 0;

  let streak = 1;
  for (let i = 0; i < dates.length - 1; i++) {
    const curr = new Date(dates[i] + 'T00:00:00');
    const prev = new Date(dates[i+1] + 'T00:00:00');
    const diff = (curr - prev) / (1000*60*60*24);
    if (diff === 1) streak++;
    else break;
  }
  return streak;
}

function getNextComp() {
  const comps = Store.comps().filter(c => daysUntil(c.date) >= 0).sort((a,b) => a.date.localeCompare(b.date));
  return comps[0] || null;
}

function renderDashboard() {
  const streak = calcStreak();
  $('#streak-count').textContent = streak;
  $('#streak-flame').textContent = streak > 0 ? '🔥' : '';

  const nextComp = getNextComp();
  const compEl = $('#dash-comp-countdown');
  if (nextComp) {
    compEl.classList.remove('hidden');
    $('#dash-comp-days').textContent = daysUntil(nextComp.date);
    $('.countdown-label').textContent = nextComp.name;
  } else {
    compEl.classList.add('hidden');
  }

  const sessions = Store.sessions().sort((a,b) => b.date.localeCompare(a.date)).slice(0, 3);
  const list = $('#recent-list');
  const empty = $('#no-sessions');

  if (sessions.length) {
    empty.classList.add('hidden');
    list.innerHTML = sessions.map(s => sessionCardHTML(s)).join('');
    list.querySelectorAll('.session-card').forEach(card => {
      card.addEventListener('click', () => openEditSession(card.dataset.id));
    });
  } else {
    empty.classList.remove('hidden');
    list.innerHTML = '';
  }
}

function sessionCardHTML(s) {
  const totalGiven = (s.rounds || []).reduce((sum, r) => sum + (r.tapsGiven || 0), 0);
  const totalReceived = (s.rounds || []).reduce((sum, r) => sum + (r.tapsReceived || 0), 0);
  const roundCount = (s.rounds || []).length;
  const comp = s.compTag ? Store.comps().find(c => c.id === s.compTag) : null;

  return `
    <div class="session-card" data-id="${s.id}">
      <div class="session-card-top">
        <span class="session-date">${formatDate(s.date)}</span>
        <span class="session-type">${s.type}</span>
      </div>
      <div class="session-stats">
        <span>${roundCount} round${roundCount !== 1 ? 's' : ''}</span>
        <span class="stat-green">▲ ${totalGiven} subs</span>
        <span class="stat-red">▼ ${totalReceived} subs</span>
      </div>
      ${s.notes ? `<div class="session-notes">${escapeHtml(s.notes)}</div>` : ''}
      ${comp ? `<div class="session-comp-tag">🏆 ${escapeHtml(comp.name)}</div>` : ''}
    </div>`;
}

function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

// ── Log Session ──
let sessionType = '';
let roundCounter = 0;

$('#btn-log-session').addEventListener('click', () => {
  resetLogForm();
  showScreen('log');
  // hide from nav
  $$('.nav-btn').forEach(b => b.classList.remove('active'));
});

$('#btn-back-log').addEventListener('click', () => showScreen('dashboard'));

$$('.type-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    $$('.type-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    sessionType = btn.dataset.type;
  });
});

$('#btn-add-round').addEventListener('click', () => addRound());

function addRound(data = {}) {
  roundCounter++;
  const container = $('#rounds-container');
  const div = document.createElement('div');
  div.className = 'round-card';
  div.innerHTML = `
    <div class="round-card-header">
      <span>Round ${roundCounter}</span>
      <button type="button" class="btn-delete btn-remove-round">Remove</button>
    </div>
    <div class="round-fields">
      <div class="round-field">
        <label>Partner</label>
        <input type="text" class="round-partner" placeholder="Name" value="${escapeHtml(data.partner || '')}">
      </div>
      <div class="round-field">
        <label>Subs Given</label>
        <input type="number" class="round-given" min="0" value="${data.tapsGiven || 0}">
      </div>
      <div class="round-field">
        <label>Subs Taken</label>
        <input type="number" class="round-received" min="0" value="${data.tapsReceived || 0}">
      </div>
    </div>`;
  container.appendChild(div);

  div.querySelector('.btn-remove-round').addEventListener('click', () => {
    div.remove();
    renumberRounds();
  });
}

function renumberRounds() {
  const cards = $$('#rounds-container .round-card');
  roundCounter = cards.length;
  cards.forEach((card, i) => {
    card.querySelector('.round-card-header span').textContent = `Round ${i + 1}`;
  });
}

function collectRounds() {
  const rounds = [];
  $$('#rounds-container .round-card').forEach(card => {
    rounds.push({
      partner: card.querySelector('.round-partner').value.trim(),
      tapsGiven: parseInt(card.querySelector('.round-given').value) || 0,
      tapsReceived: parseInt(card.querySelector('.round-received').value) || 0,
    });
  });
  return rounds;
}

function populateCompTagDropdown() {
  const select = $('#log-comp-tag');
  const comps = Store.comps();
  select.innerHTML = '<option value="">None</option>' +
    comps.map(c => `<option value="${c.id}">${escapeHtml(c.name)} (${formatDate(c.date)})</option>`).join('');
}

function resetLogForm() {
  $('#edit-session-id').value = '';
  $('#log-date').value = todayStr();
  const durEl = document.getElementById('log-duration');
  if (durEl) durEl.value = '';
  sessionType = '';
  $$('.type-btn').forEach(b => b.classList.remove('active'));
  $('#rounds-container').innerHTML = '';
  roundCounter = 0;
  addRound();
  $('#log-notes').value = '';
  populateCompTagDropdown();
  $('#log-comp-tag').value = '';
}

function openEditSession(id) {
  const session = Store.sessions().find(s => s.id === id);
  if (!session) return;

  showScreen('log');
  $$('.nav-btn').forEach(b => b.classList.remove('active'));

  $('#edit-session-id').value = session.id;
  $('#log-date').value = session.date;
  const durEl = document.getElementById('log-duration');
  if (durEl) durEl.value = session.duration || '';
  sessionType = session.type;
  $$('.type-btn').forEach(b => {
    b.classList.toggle('active', b.dataset.type === session.type);
  });

  $('#rounds-container').innerHTML = '';
  roundCounter = 0;
  (session.rounds || []).forEach(r => addRound(r));
  if (!session.rounds || !session.rounds.length) addRound();

  $('#log-notes').value = session.notes || '';
  populateCompTagDropdown();
  $('#log-comp-tag').value = session.compTag || '';
}

$('#log-form').addEventListener('submit', (e) => {
  e.preventDefault();

  if (!sessionType) {
    alert('Please select a session type.');
    return;
  }

  const session = {
    id: $('#edit-session-id').value || genId(),
    date: $('#log-date').value,
    type: sessionType,
    duration: parseInt($('#log-duration').value) || null,
    rounds: collectRounds(),
    notes: $('#log-notes').value.trim(),
    compTag: $('#log-comp-tag').value || null,
  };

  const sessions = Store.sessions();
  const existingIdx = sessions.findIndex(s => s.id === session.id);
  if (existingIdx >= 0) {
    sessions[existingIdx] = session;
  } else {
    sessions.push(session);
  }
  Store.saveSessions(sessions);

  showScreen('dashboard');
});

// ── Progress Feed ──
let progressMonth = new Date().getMonth();
let progressYear = new Date().getFullYear();

const monthNames = ['January','February','March','April','May','June','July','August','September','October','November','December'];

$('#btn-prev-month').addEventListener('click', () => {
  progressMonth--;
  if (progressMonth < 0) { progressMonth = 11; progressYear--; }
  renderProgress();
});

$('#btn-next-month').addEventListener('click', () => {
  progressMonth++;
  if (progressMonth > 11) { progressMonth = 0; progressYear++; }
  renderProgress();
});

function renderProgress() {
  $('#month-label').textContent = `${monthNames[progressMonth]} ${progressYear}`;

  const sessions = Store.sessions().filter(s => {
    const d = new Date(s.date + 'T00:00:00');
    return d.getMonth() === progressMonth && d.getFullYear() === progressYear;
  }).sort((a,b) => b.date.localeCompare(a.date));

  let totalGiven = 0, totalReceived = 0;
  sessions.forEach(s => {
    (s.rounds || []).forEach(r => {
      totalGiven += r.tapsGiven || 0;
      totalReceived += r.tapsReceived || 0;
    });
  });

  $('#stat-sessions').textContent = sessions.length;
  $('#stat-subs-given').textContent = totalGiven;
  $('#stat-subs-received').textContent = totalReceived;

  const list = $('#progress-list');
  const empty = $('#no-progress');

  if (sessions.length) {
    empty.classList.add('hidden');
    list.innerHTML = sessions.map(s => sessionCardHTML(s)).join('');
    list.querySelectorAll('.session-card').forEach(card => {
      card.addEventListener('click', () => openEditSession(card.dataset.id));
    });
  } else {
    empty.classList.remove('hidden');
    list.innerHTML = '';
  }
}

// ── Comp Prep ──
$('#btn-add-comp').addEventListener('click', () => {
  $('#comp-form-wrap').classList.toggle('hidden');
  $('#comp-name').value = '';
  $('#comp-date').value = '';
});

$('#btn-cancel-comp').addEventListener('click', () => {
  $('#comp-form-wrap').classList.add('hidden');
});

$('#comp-form').addEventListener('submit', (e) => {
  e.preventDefault();
  const comp = {
    id: genId(),
    name: $('#comp-name').value.trim(),
    date: $('#comp-date').value,
  };
  if (!comp.name || !comp.date) return;

  const comps = Store.comps();
  comps.push(comp);
  Store.saveComps(comps);

  $('#comp-form-wrap').classList.add('hidden');
  renderComps();
});

function renderComps() {
  const comps = Store.comps().sort((a,b) => a.date.localeCompare(b.date));
  const list = $('#comp-list');
  const empty = $('#no-comps');
  const sessions = Store.sessions();

  if (comps.length) {
    empty.classList.add('hidden');
    list.innerHTML = comps.map(c => {
      const days = daysUntil(c.date);
      const isPast = days < 0;
      const taggedCount = sessions.filter(s => s.compTag === c.id).length;

      return `
        <div class="comp-card ${isPast ? 'comp-past' : ''}" data-id="${c.id}">
          <div class="comp-card-top">
            <div>
              <div class="comp-card-name">${escapeHtml(c.name)}</div>
              <div class="comp-card-date">${formatDate(c.date)}</div>
            </div>
            <div class="comp-card-countdown">
              ${isPast ? 'Done' : days}
              ${isPast ? '' : '<small>days</small>'}
            </div>
          </div>
          <div class="comp-tagged-count">${taggedCount} tagged session${taggedCount !== 1 ? 's' : ''}</div>
          <button class="btn-delete btn-delete-comp" data-id="${c.id}">Delete</button>
        </div>`;
    }).join('');

    list.querySelectorAll('.btn-delete-comp').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        if (confirm('Delete this competition?')) {
          const comps = Store.comps().filter(c => c.id !== btn.dataset.id);
          Store.saveComps(comps);
          renderComps();
        }
      });
    });
  } else {
    empty.classList.remove('hidden');
    list.innerHTML = '';
  }
}

// ── Init ──
renderDashboard();
