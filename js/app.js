// ── Config ──────────────────────────────────────────────────────────────────
const ACCENT_COLORS = [
  'var(--pantone-blue)',
  'var(--pantone-teal)',
  'var(--pantone-amber)',
  'var(--pantone-purple)',
  'var(--pantone-coral)',
];

const SESSIONS_PER_ROUND = 4;
const CIRCUMFERENCE = 2 * Math.PI * 96; // SVG ring r=96 → 603.19

// ── State ───────────────────────────────────────────────────────────────────
let blockCounter   = 0;
let tasksDone      = 0;
let totalSeconds   = 30 * 60;
let remaining      = totalSeconds;
let running        = false;
let interval       = null;
let sessions       = 0;
let focusedMinutes = 0;
let sessionStart   = null;
let toastTimeout   = null;

// ── Init ─────────────────────────────────────────────────────────────────────
document.getElementById('dateBadge').textContent = new Date().toLocaleDateString('en-US', {
  weekday: 'short', month: 'short', day: 'numeric',
});

addBlock('Morning Planning', '30');
addBlock('Deep Work', '90');
addBlock('Review & Wrap-up', '30');

buildSessionDots();
updateDisplay();
setActivePreset(30);

// ── Time Blocks ──────────────────────────────────────────────────────────────
function addBlock(name = '', duration = '30', completed = false) {
  const list  = document.getElementById('blocksList');
  const id    = blockCounter++;
  const color = ACCENT_COLORS[id % ACCENT_COLORS.length];

  // FLIP: snapshot existing block positions before DOM change
  const existing  = [...list.querySelectorAll('.time-block')];
  const snapshots = existing.map(b => b.getBoundingClientRect().top);

  const block = document.createElement('div');
  block.className = 'time-block' + (completed ? ' completed' : '');
  block.dataset.id = id;
  block.dataset.counted = completed ? 'true' : 'false';
  block.innerHTML = `
    <div class="block-accent" style="background:${color}"></div>
    <div class="block-content">
      <div class="block-top">
        <input type="text" class="block-name" placeholder="Enter task here" value="${name}" />
      </div>
      <div class="block-bottom">
        <span class="duration-icon">⏱</span>
        <input type="number" class="block-duration" min="1" max="480"
               value="${duration}" title="Duration in minutes" />
        <span class="duration-label">min</span>
      </div>
    </div>
    <div class="block-right">
      <button class="block-delete" onclick="deleteBlock(this)" title="Remove">✕</button>
      <input type="checkbox" class="block-checkbox" ${completed ? 'checked' : ''}
             onchange="toggleBlock(this)" />
    </div>`;

  list.appendChild(block);
  updateBlockCount();

  // After layout recalculates, FLIP existing blocks to their old positions then animate forward
  requestAnimationFrame(() => {
    existing.forEach((b, i) => {
      const dy = snapshots[i] - b.getBoundingClientRect().top;
      if (Math.abs(dy) < 0.5) return;
      b.style.transition = 'none';
      b.style.transform  = `translateY(${dy}px)`;
      requestAnimationFrame(() => {
        b.style.transition = 'transform 0.38s cubic-bezier(0.25, 0.46, 0.45, 0.94)';
        b.style.transform  = '';
        b.addEventListener('transitionend', () => {
          b.style.transition = '';
          b.style.transform  = '';
        }, { once: true });
      });
    });

    // Fade + slide in the new block
    block.classList.add('block-entering');
    block.addEventListener('animationend', () => block.classList.remove('block-entering'), { once: true });
  });

  block.querySelector('.block-name').focus();
}

function toggleBlock(checkbox) {
  const block = checkbox.closest('.time-block');
  block.classList.toggle('completed', checkbox.checked);

  if (checkbox.checked && block.dataset.counted === 'false') {
    block.dataset.counted = 'true';
    tasksDone++;
    document.getElementById('statDone').textContent = tasksDone;
    showToast('Task complete!');
  } else if (!checkbox.checked && block.dataset.counted === 'true') {
    block.dataset.counted = 'false';
    tasksDone = Math.max(0, tasksDone - 1);
    document.getElementById('statDone').textContent = tasksDone;
  }
}

function deleteBlock(btn) {
  btn.closest('.time-block').remove();
  updateBlockCount();
}

function updateBlockCount() {
  const n = document.getElementById('blocksList').children.length;
  document.getElementById('blockCount').textContent = n + (n === 1 ? ' block' : ' blocks');
}

// ── Timer ────────────────────────────────────────────────────────────────────
function updateDisplay() {
  const m = Math.floor(remaining / 60);
  const s = remaining % 60;
  document.getElementById('timerDisplay').textContent =
    String(m).padStart(2, '0') + ':' + String(s).padStart(2, '0');

  const progress = remaining / totalSeconds;
  const offset   = CIRCUMFERENCE * (1 - progress);
  const ring     = document.getElementById('ringProgress');
  ring.style.strokeDashoffset = offset;

  if (progress > 0.5)      ring.style.stroke = 'var(--pantone-blue)';
  else if (progress > 0.2) ring.style.stroke = 'var(--pantone-amber)';
  else                     ring.style.stroke = 'var(--pantone-coral)';
}

function toggleTimer() {
  running ? pauseTimer() : startTimer();
}

function startTimer() {
  running      = true;
  sessionStart = Date.now();
  document.getElementById('playPauseBtn').textContent = '⏸';
  document.getElementById('playPauseBtn').classList.add('running');
  document.getElementById('timerPhase').textContent = 'Focusing…';
  buildSessionDots();
  interval = setInterval(tick, 1000);
}

function pauseTimer() {
  running = false;
  clearInterval(interval);
  document.getElementById('playPauseBtn').textContent = '▶';
  document.getElementById('playPauseBtn').classList.remove('running');
  document.getElementById('timerPhase').textContent = 'Paused';
  if (sessionStart) {
    focusedMinutes += Math.floor((Date.now() - sessionStart) / 60000);
    document.getElementById('statFocused').textContent = focusedMinutes + 'm';
    sessionStart = null;
  }
}

function resetTimer() {
  pauseTimer();
  remaining = totalSeconds;
  document.getElementById('timerPhase').textContent = 'Ready';
  updateDisplay();
}

function skipTimer() {
  completeSession();
}

function tick() {
  remaining--;
  updateDisplay();
  if (remaining <= 0) completeSession();
}

function completeSession() {
  pauseTimer();
  sessions++;
  document.getElementById('statSessions').textContent = sessions;
  remaining = totalSeconds;
  updateDisplay();
  document.getElementById('timerPhase').textContent = 'Session done!';
  buildSessionDots();
  showToast('Session complete! Take a break.');
}

function setPreset(mins) {
  if (running) resetTimer();
  totalSeconds = mins * 60;
  remaining    = totalSeconds;
  document.getElementById('customInput').value = mins;
  document.getElementById('timerPhase').textContent = 'Ready';
  updateDisplay();
  setActivePreset(mins);
}

function setCustomDuration(val) {
  const mins = Math.max(1, Math.min(180, parseInt(val) || 30));
  document.getElementById('customInput').value = mins;
  if (running) resetTimer();
  totalSeconds = mins * 60;
  remaining    = totalSeconds;
  document.getElementById('timerPhase').textContent = 'Ready';
  updateDisplay();
  setActivePreset(null);
}

function setActivePreset(target) {
  document.querySelectorAll('.preset-btn').forEach(btn => {
    btn.classList.toggle('active', parseInt(btn.textContent) === target);
  });
}

// ── Session Dots ─────────────────────────────────────────────────────────────
function buildSessionDots() {
  const wrap = document.getElementById('sessionDots');
  wrap.innerHTML = '';
  for (let i = 0; i < SESSIONS_PER_ROUND; i++) {
    const dot = document.createElement('div');
    dot.className = 'session-dot' +
      (i < sessions % SESSIONS_PER_ROUND ? ' done' :
       i === sessions % SESSIONS_PER_ROUND && running ? ' current' : '');
    wrap.appendChild(dot);
  }
}

// ── Toast ─────────────────────────────────────────────────────────────────────
function showToast(msg) {
  const t = document.getElementById('toast');
  t.textContent = msg;
  t.classList.add('show');
  clearTimeout(toastTimeout);
  toastTimeout = setTimeout(() => t.classList.remove('show'), 3000);
}
