// ===== STATE =====
let contacts = JSON.parse(localStorage.getItem('safeher_contacts') || '[]');
let trackingActive = false;
let watchId = null;
let currentLat = null, currentLng = null;
let sosTimer = null;
let sosProgress = 0;
let sosInterval = null;
let voiceActive = false;
let recognition = null;
let quizIndex = 0;
let quizScore = 0;
let quizAnswered = false;

// ===== INIT =====
document.addEventListener('DOMContentLoaded', () => {
  updateClock();
  setInterval(updateClock, 1000);
  renderContacts();
  renderKeywords();
  renderTips('all');
  renderQuiz();
  document.getElementById('charCount').textContent = '0';
});

function updateClock() {
  const now = new Date();
  const t = now.toLocaleTimeString();
  const el = document.getElementById('logTime');
  if (el) el.textContent = t;
}

// ===== NAVBAR =====
function toggleMenu() {
  document.getElementById('navLinks').classList.toggle('open');
}

// Active nav on scroll
window.addEventListener('scroll', () => {
  const header = document.getElementById('header');
  header.style.boxShadow = window.scrollY > 20 ? '0 2px 20px rgba(0,0,0,.4)' : 'none';
  const sections = ['home','sos','location','contacts','ai-detect','tips'];
  const navMap = {home:'nav-home',sos:'nav-sos',location:'nav-location',contacts:'nav-contacts','ai-detect':'nav-ai',tips:'nav-tips'};
  sections.forEach(id => {
    const sec = document.getElementById(id);
    if (!sec) return;
    const rect = sec.getBoundingClientRect();
    if (rect.top <= 100 && rect.bottom >= 100) {
      document.querySelectorAll('.nav__link').forEach(l => l.classList.remove('active'));
      const el = document.getElementById(navMap[id]);
      if (el) el.classList.add('active');
    }
  });
});

// ===== SOS HOLD =====
function startSosHold() {
  sosProgress = 0;
  const btn = document.getElementById('sosBtn');
  const prog = document.getElementById('sosProgress');
  const hint = document.getElementById('sosHint');
  hint.textContent = 'Keep holding…';
  sosInterval = setInterval(() => {
    sosProgress += (100 / 30);
    prog.style.width = Math.min(sosProgress, 100) + '%';
    prog.style.transition = 'width 0.1s linear';
    if (sosProgress >= 100) {
      clearInterval(sosInterval);
      triggerSOS();
    }
  }, 100);
  sosTimer = setTimeout(() => {}, 3000);
}

function cancelSosHold() {
  clearInterval(sosInterval);
  clearTimeout(sosTimer);
  sosProgress = 0;
  const prog = document.getElementById('sosProgress');
  if (prog) { prog.style.width = '0%'; }
  const hint = document.getElementById('sosHint');
  if (hint) { hint.innerHTML = 'Hold for <strong>3 seconds</strong> to activate'; }
}

function triggerSOS() {
  cancelSosHold();
  const overlay = document.getElementById('sosOverlay');
  overlay.style.display = 'flex';
  document.getElementById('statusText').textContent = '🚨 SOS ACTIVE';
  document.querySelector('.status-dot').className = 'status-dot status-dot--active';
  addLog('🚨 SOS Triggered! Alerting contacts…', 'danger');
  if (currentLat) {
    const link = `https://maps.google.com/?q=${currentLat},${currentLng}`;
    document.getElementById('sosLocation').innerHTML = `📍 Location: <a href="${link}" target="_blank" style="color:#c084fc">${currentLat.toFixed(5)}, ${currentLng.toFixed(5)}</a>`;
    addLog(`📍 Location shared: ${currentLat.toFixed(4)}, ${currentLng.toFixed(4)}`, 'success');
  } else {
    document.getElementById('sosLocation').textContent = '📍 Location not available';
    addLog('⚠️ Location unavailable', 'info');
  }
  contacts.forEach(c => addLog(`📱 Alert sent to ${c.name}`, 'success'));
  showToast('🚨 SOS Activated! Contacts notified.', 'error');
}

function dismissSOS() {
  document.getElementById('sosOverlay').style.display = 'none';
  document.getElementById('statusText').textContent = 'System Ready';
  document.querySelector('.status-dot').className = 'status-dot status-dot--idle';
  addLog('✅ SOS dismissed', 'info');
  showToast('SOS cancelled', 'info');
}

function addLog(msg, type) {
  const log = document.getElementById('sosLog');
  const entry = document.createElement('div');
  entry.className = `log-entry log-entry--${type}`;
  entry.innerHTML = `<span class="log-time">${new Date().toLocaleTimeString()}</span><span>${msg}</span>`;
  log.appendChild(entry);
  log.scrollTop = log.scrollHeight;
}

// ===== LOCATION TRACKING =====
function toggleTracking() {
  if (!trackingActive) startTracking();
  else stopTracking();
}

function startTracking() {
  if (!navigator.geolocation) { showToast('Geolocation not supported', 'error'); return; }
  trackingActive = true;
  document.getElementById('trackingBtn').innerHTML = '<span>⏹</span> Stop Tracking';
  document.getElementById('trackingBtn').style.background = 'linear-gradient(135deg,#ef4444,#b91c1c)';
  showToast('📍 Location tracking started', 'success');
  watchId = navigator.geolocation.watchPosition(onLocationSuccess, onLocationError, {
    enableHighAccuracy: true, maximumAge: 5000
  });
}

function stopTracking() {
  trackingActive = false;
  if (watchId) navigator.geolocation.clearWatch(watchId);
  document.getElementById('trackingBtn').innerHTML = '<span>▶</span> Start Tracking';
  document.getElementById('trackingBtn').style.background = '';
  document.getElementById('mapEmbed').style.display = 'none';
  document.getElementById('mapPlaceholder').style.display = 'flex';
  showToast('Tracking stopped', 'info');
}

function onLocationSuccess(pos) {
  currentLat = pos.coords.latitude;
  currentLng = pos.coords.longitude;
  const acc = Math.round(pos.coords.accuracy);
  document.getElementById('coordLat').textContent = currentLat.toFixed(6) + '°';
  document.getElementById('coordLng').textContent = currentLng.toFixed(6) + '°';
  document.getElementById('coordAcc').textContent = acc + ' m';
  document.getElementById('coordTime').textContent = new Date().toLocaleTimeString();
  document.getElementById('mapAccuracy').textContent = `📡 Accuracy: ±${acc}m`;
  const link = `https://maps.google.com/?q=${currentLat},${currentLng}`;
  document.getElementById('shareLink').value = link;
  document.getElementById('mapPlaceholder').style.display = 'none';
  document.getElementById('mapEmbed').style.display = 'block';
  document.getElementById('mapFrame').src = `https://maps.google.com/maps?q=${currentLat},${currentLng}&z=16&output=embed`;
  addHistoryEntry(currentLat, currentLng);
}

function onLocationError(err) {
  showToast('Location error: ' + err.message, 'error');
}

function addHistoryEntry(lat, lng) {
  const list = document.getElementById('historyList');
  const empty = list.querySelector('.history-empty');
  if (empty) empty.remove();
  const item = document.createElement('div');
  item.className = 'history-item';
  item.innerHTML = `<span>${lat.toFixed(4)}, ${lng.toFixed(4)}</span><span>${new Date().toLocaleTimeString()}</span>`;
  list.prepend(item);
  if (list.children.length > 5) list.removeChild(list.lastChild);
}

function copyShareLink() {
  const input = document.getElementById('shareLink');
  if (!input.value) { showToast('No link to copy', 'error'); return; }
  navigator.clipboard.writeText(input.value).then(() => showToast('Link copied!', 'success'));
}

function shareViaWhatsApp() {
  if (!currentLat) { showToast('Start tracking first', 'error'); return; }
  const msg = encodeURIComponent(`🆘 My live location: https://maps.google.com/?q=${currentLat},${currentLng}`);
  window.open(`https://wa.me/?text=${msg}`, '_blank');
}

// ===== CONTACTS =====
function addContact() {
  const name = document.getElementById('contactName').value.trim();
  const phone = document.getElementById('contactPhone').value.trim();
  const rel = document.getElementById('contactRelation').value;
  if (!name || !phone) { showToast('Fill in name and phone', 'error'); return; }
  const contact = { id: Date.now(), name, phone, relation: rel };
  contacts.push(contact);
  localStorage.setItem('safeher_contacts', JSON.stringify(contacts));
  document.getElementById('contactName').value = '';
  document.getElementById('contactPhone').value = '';
  renderContacts();
  showToast(`✅ ${name} added`, 'success');
}

function deleteContact(id) {
  contacts = contacts.filter(c => c.id !== id);
  localStorage.setItem('safeher_contacts', JSON.stringify(contacts));
  renderContacts();
  showToast('Contact removed', 'info');
}

function callContact(phone) {
  window.location.href = `tel:${phone}`;
}

function renderContacts() {
  const list = document.getElementById('contactsList');
  const count = document.getElementById('contactCount');
  count.textContent = contacts.length + (contacts.length === 1 ? ' contact' : ' contacts');
  if (contacts.length === 0) {
    list.innerHTML = `<div class="contacts__empty" id="contactsEmpty"><div class="empty-icon">📭</div><p>No contacts added yet.</p><small>Add your trusted people to the left.</small></div>`;
    return;
  }
  list.innerHTML = contacts.map(c => `
    <div class="contact-card">
      <div class="contact-info">
        <strong>${c.name}</strong>
        <span>${c.phone} · ${c.relation}</span>
      </div>
      <div class="contact-actions">
        <button class="btn-icon" onclick="callContact('${c.phone}')" title="Call">📞</button>
        <button class="btn-icon" onclick="deleteContact(${c.id})" title="Delete">🗑️</button>
      </div>
    </div>`).join('');
}

// ===== AI DETECTION =====
const DANGER_KEYWORDS = {
  critical: ['help me','rape','kill','murder','kidnap','attack','assault','stab','gun','knife','shoot'],
  high: ['follow','stalking','threat','danger','scared','afraid','unsafe','chase','harass','abuse'],
  medium: ['uncomfortable','nervous','worried','suspicious','alone','dark','lost','drunk man','stranger'],
  low: ['uncomfortable','odd','weird','uneasy','watch','stare']
};

function analyzeText(show) {
  const text = document.getElementById('aiInput').value.toLowerCase();
  document.getElementById('charCount').textContent = document.getElementById('aiInput').value.length;
  if (!text.trim() && show) { showToast('Type or speak something first', 'error'); return; }
  if (!text.trim()) return;

  let level = 0, found = [];
  const check = (words, score) => words.forEach(w => { if (text.includes(w)) { level = Math.max(level, score); found.push(w); } });
  check(DANGER_KEYWORDS.low, 1);
  check(DANGER_KEYWORDS.medium, 2);
  check(DANGER_KEYWORDS.high, 3);
  check(DANGER_KEYWORDS.critical, 4);

  const labels = ['', 'Low', 'Medium', 'High', 'Critical'];
  const cls = ['', 'badge-safe', 'badge-medium', 'badge-high', 'badge-critical'];
  const pct = [0, 25, 50, 75, 100];
  const recs = [
    'No danger detected. Stay alert.',
    'Stay aware of your surroundings. Trust your instincts.',
    'Move to a public area. Call a trusted person.',
    'Leave the area immediately. Alert emergency contacts.',
    '🚨 Trigger SOS NOW. Call 112 immediately!'
  ];

  document.getElementById('aiIdle').style.display = 'none';
  document.getElementById('aiResult').style.display = 'block';
  document.getElementById('threatBadge').textContent = labels[level] || 'Safe';
  document.getElementById('threatBadge').className = 'threat-badge ' + (cls[level] || 'badge-safe');
  document.getElementById('threatFill').style.width = (pct[level] || 5) + '%';
  document.getElementById('keywordTags').innerHTML = found.length
    ? found.map(w => `<span class="keyword-tag">${w}</span>`).join('')
    : '<span style="color:#64748b;font-size:.85rem">No danger keywords found</span>';
  document.getElementById('recText').textContent = recs[level];
  document.getElementById('aiQuickActions').style.display = level >= 3 ? 'flex' : 'none';
}

function renderKeywords() {
  const all = [...new Set([...DANGER_KEYWORDS.critical, ...DANGER_KEYWORDS.high, ...DANGER_KEYWORDS.medium])];
  document.getElementById('keywordsGrid').innerHTML = all.map(w => `<span class="kw-chip">${w}</span>`).join('');
}

// Voice Input
function toggleVoice() {
  if (!('webkitSpeechRecognition' in window || 'SpeechRecognition' in window)) {
    showToast('Voice not supported in this browser', 'error'); return;
  }
  if (voiceActive) {
    recognition.stop(); return;
  }
  const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
  recognition = new SR();
  recognition.lang = 'en-IN';
  recognition.interimResults = false;
  recognition.onstart = () => {
    voiceActive = true;
    document.getElementById('micLabel').textContent = 'Listening…';
    document.getElementById('micBtn').classList.add('recording');
    document.getElementById('micWave').classList.add('active');
  };
  recognition.onresult = e => {
    const t = e.results[0][0].transcript;
    document.getElementById('aiInput').value = t;
    analyzeText(true);
  };
  recognition.onend = () => {
    voiceActive = false;
    document.getElementById('micLabel').textContent = 'Tap to Speak';
    document.getElementById('micBtn').classList.remove('recording');
    document.getElementById('micWave').classList.remove('active');
  };
  recognition.onerror = () => { showToast('Voice error. Try typing instead.', 'error'); recognition.stop(); };
  recognition.start();
}

// ===== TIPS =====
const TIPS = [
  {cat:'travel',icon:'🚌',title:'Safe Travel',text:'Share your travel route with a trusted contact before heading out.'},
  {cat:'travel',icon:'🚖',title:'Verify Cabs',text:'Always verify ride-share driver details before getting in.'},
  {cat:'digital',icon:'🔒',title:'Strong Passwords',text:'Use unique passwords for all accounts. Enable 2FA everywhere.'},
  {cat:'digital',icon:'📵',title:'Location Privacy',text:'Turn off location sharing on social media when not needed.'},
  {cat:'home',icon:'🏠',title:'Secure Your Home',text:'Install a peephole or doorbell camera. Never open doors to strangers.'},
  {cat:'home',icon:'🔑',title:'Key Safety',text:'Don\'t hide spare keys outside. Share with only trusted people.'},
  {cat:'emergency',icon:'📞',title:'Emergency Numbers',text:'Save 100 (Police), 1091 (Women), 112 (Emergency) in your phone.'},
  {cat:'emergency',icon:'🆘',title:'Trust Instincts',text:'If something feels wrong, leave immediately. Your safety is priority.'},
  {cat:'travel',icon:'🌙',title:'Night Safety',text:'Walk in well-lit areas. Avoid shortcuts through isolated routes at night.'},
];

function renderTips(cat) {
  const grid = document.getElementById('tipsGrid');
  const filtered = cat === 'all' ? TIPS : TIPS.filter(t => t.cat === cat);
  grid.innerHTML = filtered.map(t => `
    <div class="tip-card" data-cat="${t.cat}">
      <div class="tip-card__icon">${t.icon}</div>
      <div class="tip-card__title">${t.title}</div>
      <div class="tip-card__text">${t.text}</div>
    </div>`).join('');
}

function filterTips(cat, btn) {
  document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  renderTips(cat);
}

// ===== QUIZ =====
const QUIZ = [
  {q:'What is the national women helpline number in India?',opts:['100','1091','112','102'],ans:1},
  {q:'Which emergency number works across all operators in India?',opts:['100','1800','112','911'],ans:2},
  {q:'When should you share your live location?',opts:['Never','Always publicly','With trusted contacts when traveling alone','Only with strangers'],ans:2},
  {q:'What should you do if a stranger follows you?',opts:['Walk faster alone','Enter a crowded public place and call for help','Ignore them','Run into a dark alley'],ans:1},
  {q:'How long should you hold SOS in SafeHer to trigger it?',opts:['1 second','5 seconds','3 seconds','10 seconds'],ans:2},
];

function renderQuiz() {
  quizAnswered = false;
  const q = QUIZ[quizIndex];
  document.getElementById('quizQuestion').textContent = `Q${quizIndex+1}. ${q.q}`;
  document.getElementById('quizProgress').textContent = `Question ${quizIndex+1} of ${QUIZ.length}`;
  document.getElementById('quizFeedback').style.display = 'none';
  document.getElementById('nextQuizBtn').style.display = 'none';
  document.getElementById('quizOptions').innerHTML = q.opts.map((o,i) =>
    `<button class="quiz__option" onclick="answerQuiz(${i})">${o}</button>`).join('');
}

function answerQuiz(idx) {
  if (quizAnswered) return;
  quizAnswered = true;
  const q = QUIZ[quizIndex];
  const opts = document.querySelectorAll('.quiz__option');
  opts[idx].classList.add(idx === q.ans ? 'correct' : 'wrong');
  opts[q.ans].classList.add('correct');
  opts.forEach(o => o.disabled = true);
  const fb = document.getElementById('quizFeedback');
  fb.style.display = 'block';
  if (idx === q.ans) {
    quizScore++;
    fb.textContent = '✅ Correct!';
    fb.className = 'quiz__feedback correct';
  } else {
    fb.textContent = `❌ Wrong! Correct: "${q.opts[q.ans]}"`;
    fb.className = 'quiz__feedback wrong';
  }
  document.getElementById('nextQuizBtn').style.display = 'block';
}

function nextQuizQuestion() {
  quizIndex++;
  if (quizIndex >= QUIZ.length) {
    document.getElementById('quizBody').innerHTML = `
      <div style="text-align:center;padding:2rem;">
        <div style="font-size:3rem;">🎉</div>
        <h3 style="color:#c084fc;margin:.8rem 0">Quiz Complete!</h3>
        <p style="color:#94a3b8">You scored <strong style="color:#fff">${quizScore}/${QUIZ.length}</strong></p>
        <button class="btn btn--primary" style="margin-top:1rem" onclick="restartQuiz()">Restart Quiz</button>
      </div>`;
    return;
  }
  renderQuiz();
}

function restartQuiz() {
  quizIndex = 0; quizScore = 0;
  document.getElementById('quizBody').innerHTML = `
    <div class="quiz__question" id="quizQuestion"></div>
    <div class="quiz__options" id="quizOptions"></div>
    <div class="quiz__feedback" id="quizFeedback" style="display:none;"></div>
    <div class="quiz__nav">
      <span class="quiz__progress" id="quizProgress">Question 1 of 5</span>
      <button class="btn btn--primary" id="nextQuizBtn" onclick="nextQuizQuestion()" style="display:none;">Next →</button>
    </div>`;
  renderQuiz();
}

// ===== TOAST =====
function showToast(msg, type = 'info') {
  const container = document.getElementById('toastContainer');
  const toast = document.createElement('div');
  toast.className = `toast toast--${type}`;
  toast.textContent = msg;
  container.appendChild(toast);
  setTimeout(() => { toast.style.opacity = '0'; toast.style.transition = 'opacity .3s'; setTimeout(() => toast.remove(), 300); }, 3000);
}
