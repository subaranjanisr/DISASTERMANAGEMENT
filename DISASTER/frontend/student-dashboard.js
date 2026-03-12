/**
 * SAFEGUARD — Student Dashboard JS
 */

// ── Load user from localStorage ──
const API_BASE = 'http://localhost:5000/api/v1';
let currentUser = {};

document.addEventListener('DOMContentLoaded', () => {
    const token = localStorage.getItem('safeguard_token');
    const userStr = localStorage.getItem('safeguard_user');

    if (!token || !userStr) {
        window.location.href = 'login.html';
        return;
    }

    try {
        currentUser = JSON.parse(userStr);
        if (currentUser.role !== 'student') {
            window.location.href = 'login.html';
            return;
        }
        initDashboard(currentUser);
    } catch {
        window.location.href = 'login.html';
    }
});

function initDashboard(user) {
    const firstName = user.firstName || 'Hero';
    const score = user.preparednessScore || 72;
    const xp = user.xpPoints || 1450;
    const level = user.level || 4;
    const streak = user.streak || 7;
    const levelLabels = ['', 'Novice', 'Learner', 'Prepared', 'Hero', 'Guardian', 'Legend'];

    // Greeting
    const hr = new Date().getHours();
    document.getElementById('greetingTime').textContent =
        hr < 12 ? 'Good Morning' : hr < 17 ? 'Good Afternoon' : 'Good Evening';

    // Hero section
    document.getElementById('heroName').textContent = firstName;
    document.getElementById('heroSubtitle').textContent =
        score < 50
            ? `You're ${score}% disaster-ready. Keep training to improve! 💪`
            : `You're ${score}% disaster-ready. Complete today's drill to level up! 🔥`;

    // Stat numbers
    document.getElementById('scoreNum').textContent = score;
    document.getElementById('xpNum').textContent = xp.toLocaleString();
    document.getElementById('streakNum').textContent = streak;
    document.getElementById('orbLevel').textContent = `Lvl ${level}`;

    // Sidebar
    document.getElementById('sidebarName').textContent = firstName;
    document.getElementById('sidebarLevel').textContent = `Level ${level} ${levelLabels[level] || ''}`;
    const avatarUrl = `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.id || firstName}`;
    document.getElementById('sidebarAvatar').src = avatarUrl;
    const lbAvatar = document.getElementById('lbUserAvatar');
    if (lbAvatar) lbAvatar.src = avatarUrl;
    const lbName = document.getElementById('lbUserName');
    if (lbName) lbName.textContent = firstName;

    // Score ring animation
    animateScoreRing('scoreFill', score, 327);
    animateScoreRing('bigFill', score, 534);
    document.getElementById('bigScoreNum').textContent = score + '%';

    // Level bar
    const xpForNext = 2000;
    const xpProgress = Math.min((xp / xpForNext) * 100, 100);
    const lf = document.getElementById('levelFill');
    if (lf) setTimeout(() => { lf.style.width = xpProgress + '%'; }, 300);
    const lc = document.getElementById('levelCircle');
    if (lc) lc.textContent = level;

    injectSVGDefs();
}

function animateScoreRing(id, score, total) {
    const el = document.getElementById(id);
    if (!el) return;
    const offset = total - (total * score) / 100;
    setTimeout(() => { el.style.strokeDashoffset = offset; }, 400);
}

function injectSVGDefs() {
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.style.cssText = 'position:absolute;width:0;height:0;overflow:hidden';
    svg.innerHTML = `
    <defs>
      <linearGradient id="scoreGrad" x1="0%" y1="0%" x2="100%" y2="0%">
        <stop offset="0%" stop-color="#4361ee"/>
        <stop offset="100%" stop-color="#7b2fff"/>
      </linearGradient>
      <linearGradient id="bigGrad" x1="0%" y1="0%" x2="100%" y2="0%">
        <stop offset="0%" stop-color="#06d6a0"/>
        <stop offset="100%" stop-color="#4361ee"/>
      </linearGradient>
    </defs>`;
    document.body.prepend(svg);
}

// ══════════════════════════════════════════════
//  NAVIGATION
// ══════════════════════════════════════════════
function switchSection(id, el) {
    document.querySelectorAll('.section').forEach(s => s.classList.remove('active'));
    document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
    const sec = document.getElementById('section-' + id);
    if (sec) sec.classList.add('active');
    if (el) el.classList.add('active');

    const labels = { dashboard: 'Command Center', drills: 'VR Drills', learning: 'Learning Hub', progress: 'My Progress', achievements: 'Achievements' };
    document.getElementById('sectionLabel').textContent = labels[id] || id;
    return false;
}

function toggleSidebar() {
    document.getElementById('sidebar').classList.toggle('open');
}

// ══════════════════════════════════════════════
//  NOTIFICATIONS
// ══════════════════════════════════════════════
function toggleNotifications() {
    const panel = document.getElementById('notifPanel');
    const overlay = document.getElementById('notifOverlay');
    const dot = document.getElementById('notifDot');
    panel.classList.toggle('open');
    overlay.classList.toggle('active');
    if (panel.classList.contains('open') && dot) dot.style.display = 'none';
}

function markAllRead() {
    document.querySelectorAll('.notif-item.unread').forEach(el => el.classList.remove('unread'));
    showToast('All notifications marked as read', 'success');
}

// ══════════════════════════════════════════════
//  CHAT / AI
// ══════════════════════════════════════════════
function toggleChat() {
    document.getElementById('chatPanel').classList.toggle('open');
}

function chatKeyPress(e) {
    if (e.key === 'Enter') sendChat();
}

const aiResponses = {
    earthquake: [
        "🏚️ During an earthquake: DROP to your knees, take COVER under a sturdy table or against an interior wall, and HOLD ON until shaking stops.",
        "After the shaking stops, move away from buildings, trees and power lines. Expect aftershocks!",
        "Before the next drill, check your building for safe spots — away from windows, heavy furniture, and exterior walls."
    ],
    fire: [
        "🔥 FIRE SAFETY: Remember RACE — Rescue, Alarm, Confine, Evacuate. Stay low under smoke!",
        "When evacuating: feel the door before opening it. If hot, use another exit. Never use elevators.",
        "Your fire drill is 40% complete. Continue it today to unlock the Speed Runner achievement!"
    ],
    flood: [
        "🌊 FLOOD: Move to high ground immediately. Never walk or drive through flood water — 6 inches can knock you down!",
        "Sign up for local emergency alerts and know your campus flood zones before the next heavy rain.",
        "I recommend starting the Flood Response Drill — it's waiting for you and worth +200 XP!"
    ],
    evacuation: [
        "🚪 Evacuation tips: Know at least 2 exits from every room. Crawl low in smoke. Meet at the designated assembly point.",
        "SAFEGUARD tip: Practice your evacuation route at least once a month. Muscle memory saves lives!"
    ],
    default: [
        "I'm here to help! Ask me about earthquake, fire, flood, or medical emergencies.",
        "💡 Tip: Complete your fire evacuation drill today — you're almost halfway through!",
        "Your preparedness score is 72%. Try completing all 3 active drills to reach 85%!",
        "Need a safety tip? Ask about any disaster type and I'll give you step-by-step guidance."
    ]
};

function askAI(question) {
    document.getElementById('chatPanel').classList.add('open');
    const input = document.getElementById('chatInput');
    input.value = question;
    sendChat();
}

function sendChat() {
    const input = document.getElementById('chatInput');
    const text = input.value.trim();
    if (!text) return;

    addChatMsg(text, 'user');
    input.value = '';

    setTimeout(() => {
        const lower = text.toLowerCase();
        let bucket = 'default';
        if (lower.includes('earthquake') || lower.includes('quake')) bucket = 'earthquake';
        else if (lower.includes('fire') || lower.includes('extinguish')) bucket = 'fire';
        else if (lower.includes('flood') || lower.includes('water')) bucket = 'flood';
        else if (lower.includes('evacuat') || lower.includes('exit')) bucket = 'evacuation';

        const arr = aiResponses[bucket];
        const reply = arr[Math.floor(Math.random() * arr.length)];
        addChatMsg(reply, 'ai');
    }, 800);
}

function addChatMsg(text, sender) {
    const area = document.getElementById('chatMessages');
    const div = document.createElement('div');
    div.className = `chat-msg ${sender}`;
    div.innerHTML = `
    ${sender === 'ai' ? '<span class="msg-avatar">🤖</span>' : ''}
    <div class="msg-bubble">${text}</div>
    ${sender === 'user' ? '<span class="msg-avatar">👤</span>' : ''}
  `;
    area.appendChild(div);
    area.scrollTop = area.scrollHeight;
}

// ══════════════════════════════════════════════
//  SOS MODAL
// ══════════════════════════════════════════════
function openSOS() {
    document.getElementById('sosModal').classList.add('open');
}
function closeSOS() {
    document.getElementById('sosModal').classList.remove('open');
}

const sosGuides = {
    fire: `🔥 <strong>FIRE EMERGENCY — RACE Protocol</strong><br>
    1. RESCUE anyone in immediate danger if safe to do so<br>
    2. ALARM — pull the nearest fire alarm<br>
    3. CONFINE — close doors to slow fire spread<br>
    4. EVACUATE — leave via nearest exit, stay LOW under smoke<br>
    5. Meet at the <strong>campus assembly point</strong><br>
    6. Never re-enter the building. Call <strong>911</strong>`,
    flood: `🌊 <strong>FLOOD EMERGENCY</strong><br>
    1. Move to <strong>high ground immediately</strong> — do not wait<br>
    2. Never walk through moving water (6 inches can knock you over)<br>
    3. Avoid storm drains, streams and rivers<br>
    4. Disconnect electrical appliances if safe<br>
    5. Call <strong>911</strong> if trapped — signal from windows<br>
    6. Follow campus emergency broadcast instructions`,
    earthquake: `🏚️ <strong>EARTHQUAKE — DROP, COVER, HOLD ON</strong><br>
    1. DROP to your hands and knees immediately<br>
    2. COVER your head/neck under a sturdy desk or table<br>
    3. HOLD ON until shaking completely stops<br>
    4. Stay away from windows and exterior walls<br>
    5. After shaking: evacuate carefully, watch for debris<br>
    6. Expect aftershocks — stay alert`,
    medical: `🏥 <strong>MEDICAL EMERGENCY</strong><br>
    1. Call <strong>911</strong> or Campus Security immediately<br>
    2. Stay calm and keep the person still<br>
    3. Check for breathing and pulse<br>
    4. Apply firm pressure to any bleeding wounds<br>
    5. Do NOT move someone with a suspected spinal injury<br>
    6. Start CPR if trained and person is unresponsive`
};

function showSOSGuide(type) {
    const el = document.getElementById('sosGuideText');
    el.innerHTML = sosGuides[type] || '<p>Select an emergency type above</p>';
    el.style.borderColor = { fire: '#ef4444', flood: '#48cae4', earthquake: '#8338ec', medical: '#06d6a0' }[type] || 'var(--border)';
}

// ══════════════════════════════════════════════
//  DRILL MODAL
// ══════════════════════════════════════════════
const drillData = {
    earthquake: {
        title: '🏚️ Earthquake Survival Drill',
        color: '#8338ec',
        steps: ['STEP 1: When you feel shaking, immediately DROP to your hands and knees', 'STEP 2: COVER your head and neck with your arms, or get under a sturdy desk', 'STEP 3: HOLD ON to your shelter and stay put until the shaking completely stops', 'STEP 4: Once safe, move away from windows — check for gas leaks and structural damage', 'STEP 5: Proceed to the campus assembly point via the safest route'],
        score: '950/1000',
        status: 'completed'
    },
    fire: {
        title: '🔥 Fire Evacuation Drill',
        color: '#ff6b35',
        steps: ['STEP 1: Upon hearing the alarm, leave everything and exit immediately', 'STEP 2: Feel doors before opening — if hot, use alternate exit', 'STEP 3: Stay LOW — crawl under smoke if present (cleaner air near floor)', 'STEP 4: Use stairs, NEVER elevators during a fire', 'STEP 5: Reach the assembly point and confirm your attendance'],
        score: null,
        status: 'in-progress'
    },
    flood: {
        title: '🌊 Flood Response Drill',
        color: '#48cae4',
        steps: ['STEP 1: On flood warning, move to upper floors or high ground immediately', 'STEP 2: Avoid all contact with flood water — it may be electrified or contaminated', 'STEP 3: Secure your important documents in a waterproof bag', 'STEP 4: Tune in to emergency broadcasts for campus updates', 'STEP 5: Do not return until authorities declare it safe'],
        score: null,
        status: 'pending'
    }
};

function openDrillModal(type) {
    const d = drillData[type];
    if (!d) return;
    const body = document.getElementById('drillModalBody');
    body.innerHTML = `
    <div style="border-bottom:1px solid rgba(255,255,255,.08);padding-bottom:20px;margin-bottom:20px;">
      <h2 style="font-size:1.4rem;margin-bottom:8px;">${d.title}</h2>
      <p style="color:var(--muted);font-size:.88rem;">Follow these steps carefully during the simulation</p>
    </div>
    <div style="display:flex;flex-direction:column;gap:12px;margin-bottom:24px;">
      ${d.steps.map((s, i) => `
        <div style="display:flex;gap:14px;align-items:flex-start;padding:14px;background:rgba(255,255,255,.04);border-radius:12px;border:1px solid rgba(255,255,255,.07)">
          <div style="width:28px;height:28px;border-radius:50%;background:${d.color}25;border:1px solid ${d.color}55;display:flex;align-items:center;justify-content:center;font-size:.78rem;font-weight:700;color:${d.color};flex-shrink:0">${i + 1}</div>
          <span style="font-size:.88rem;line-height:1.5;padding-top:4px">${s}</span>
        </div>`).join('')}
    </div>
    ${d.score ? `<div style="background:rgba(6,214,160,.1);border:1px solid rgba(6,214,160,.25);border-radius:12px;padding:14px;text-align:center;margin-bottom:20px;font-size:.9rem;">✅ Last Score: <strong style="color:var(--green)">${d.score}</strong></div>` : ''}
    <div style="display:flex;gap:12px;">
      <button onclick="startSimulation('${type}')" class="drill-btn-primary" style="flex:1;padding:14px;border-radius:12px;background:linear-gradient(135deg,var(--blue),var(--purple));border:none;color:#fff;font-weight:700;cursor:pointer;font-size:.95rem;">
        ${d.status === 'completed' ? '↩ Retry Drill' : d.status === 'in-progress' ? '▶ Continue Drill' : '▶ Start Drill'}
      </button>
      <button onclick="closeDrillModal()" style="padding:14px 20px;border-radius:12px;background:rgba(255,255,255,.07);border:1px solid rgba(255,255,255,.1);color:var(--text);cursor:pointer;">Cancel</button>
    </div>`;
    document.getElementById('drillModal').classList.add('open');
}

function closeDrillModal() {
    document.getElementById('drillModal').classList.remove('open');
}

function startSimulation(type) {
    closeDrillModal();
    showToast(`🥽 Loading ${type} VR simulation...`, 'info');
    setTimeout(() => {
        showToast(`🎯 ${type.charAt(0).toUpperCase() + type.slice(1)} drill started! Follow the on-screen prompts.`, 'success');
    }, 2000);
}

function previewDrill(type) {
    showToast(`👁 Loading ${type} drill preview...`, 'info');
}

function showDrillFeedback(type) {
    const msgs = {
        earthquake: '⭐ Excellent! 95% accuracy — you mastered DROP, COVER, HOLD ON!',
        fire: '📋 Checkpoint: You found exit 2 correctly. Next: practice staying low under smoke.',
    };
    showToast(msgs[type] || 'Feedback loading...', 'info');
}

function startQuickDrill() {
    openDrillModal('fire');
}

// ══════════════════════════════════════════════
//  DYNAMIC EARTHQUAKE SIMULATION
// ══════════════════════════════════════════════
let eqInterval = null;

function startDynamicEQ() {
    const shakeEl = document.querySelector('.earthquake-scene .shake-element');
    const magEl = document.getElementById('eqMagnitude');
    const intensityEl = document.getElementById('eqIntensity');
    const liveIndicator = document.querySelector('.live-indicator');

    showToast('🏚️ Initiating Dynamic Seismic Environment...', 'warning');

    // Toggle Extreme Shaking
    if (shakeEl) shakeEl.classList.add('extreme');
    if (liveIndicator) liveIndicator.innerHTML = '● CRITICAL EVENT';

    // Simulate haptic feedback via screen shake (subtle)
    document.body.classList.add('haptic-shake');

    if (eqInterval) clearInterval(eqInterval);

    eqInterval = setInterval(() => {
        const mag = (7 + Math.random() * 1.5).toFixed(1);
        const intensities = ['Very Strong', 'Severe', 'Violent', 'Extreme'];
        const randInt = intensities[Math.floor(Math.random() * intensities.length)];

        if (magEl) magEl.textContent = `${mag} M`;
        if (intensityEl) {
            intensityEl.textContent = randInt;
            intensityEl.style.color = mag > 8 ? '#f43f5e' : '#fbbf24';
        }

        // Update bars
        document.querySelectorAll('.seismic-graph .bar').forEach(bar => {
            bar.style.setProperty('--h', `${Math.floor(Math.random() * 80 + 20)}%`);
        });

    }, 1500);

    setTimeout(() => {
        if (shakeEl) shakeEl.classList.remove('extreme');
        document.body.classList.remove('haptic-shake');
        if (liveIndicator) liveIndicator.innerHTML = '● Live Data';
        clearInterval(eqInterval);
        showToast('✅ Dynamic Drill Segment Complete. Accuracy: 98%', 'success');
    }, 10000);
}

// ══════════════════════════════════════════════
//  DYNAMIC FIRE SIMULATION
// ══════════════════════════════════════════════
let fireInterval = null;

function startDynamicFire() {
    const hazardEl = document.getElementById('fireHazard');
    const tempEl = document.getElementById('fireTemp');
    const o2El = document.getElementById('fireO2');
    const thermalBar = document.getElementById('thermalBar');
    const fireScene = document.querySelector('.fire-scene');

    showToast('🔥 Deploying Thermal Simulation Environment...', 'warning');

    if (fireInterval) clearInterval(fireInterval);

    // Intense flicker overlay
    if (fireScene) fireScene.classList.add('tactical-active');

    fireInterval = setInterval(() => {
        const temp = Math.floor(40 + Math.random() * 80);
        const o2 = (21 - Math.random() * 5).toFixed(1);
        const thermalWidth = Math.min((temp / 200) * 100, 100);

        if (tempEl) tempEl.textContent = `${temp}°C`;
        if (o2El) o2El.textContent = `${o2}%`;
        if (thermalBar) thermalBar.style.setProperty('--w', `${thermalWidth}%`);

        if (hazardEl) {
            if (temp > 90) {
                hazardEl.textContent = 'EXTREME';
                hazardEl.classList.add('extreme-heat');
            } else {
                hazardEl.textContent = 'CAUTION';
                hazardEl.classList.remove('extreme-heat');
            }
        }

    }, 1200);

    setTimeout(() => {
        clearInterval(fireInterval);
        if (fireScene) fireScene.classList.remove('tactical-active');
        showToast('🚒 Fire Drill Checkpoint Reached: Assembly Point Clear.', 'success');
    }, 10000);
}

// ══════════════════════════════════════════════
//  DYNAMIC FLOOD SIMULATION
// ══════════════════════════════════════════════
let floodInterval = null;

function startDynamicFlood() {
    const levelEl = document.getElementById('floodLevel');
    const elevEl = document.getElementById('floodElev');
    const distEl = document.getElementById('floodDist');
    const dotEl = document.getElementById('elevDot');

    showToast('🌊 Hydro-Mission Active: Evacuate to higher ground immediately!', 'warning');

    if (floodInterval) clearInterval(floodInterval);

    let currentElev = 12;
    let waterLevel = 0.0;
    let distance = 150;

    floodInterval = setInterval(() => {
        // Water rises
        waterLevel += 0.08;
        // User moves (simulated)
        currentElev += Math.random() > 0.3 ? 1 : 0;
        distance -= 5;

        if (levelEl) levelEl.textContent = `${waterLevel.toFixed(1)}m`;
        if (elevEl) elevEl.textContent = `${currentElev}m`;
        if (distEl) distEl.textContent = `${Math.max(0, distance)}m`;
        if (dotEl) {
            const yPos = Math.min(100, (currentElev / 30) * 100);
            dotEl.style.setProperty('--y', `${yPos}%`);
        }

        if (waterLevel > 1.5 && currentElev < 15) {
            showToast('⚠️ WATER DEPTH CRITICAL: MOVE FASTER!', 'danger');
        }

        if (distance <= 0) {
            clearInterval(floodInterval);
            showToast('🏆 Safe Zone Reached! Flood response protocol mastered.', 'success');
        }
    }, 1000);

    setTimeout(() => {
        if (floodInterval) clearInterval(floodInterval);
    }, 15000); // Safety timeout
}

// ══════════════════════════════════════════════
//  LEARNING
// ══════════════════════════════════════════════
function switchLTab(tab, el) {
    document.querySelectorAll('.ltab-content').forEach(c => c.classList.remove('active'));
    document.querySelectorAll('.ltab').forEach(b => b.classList.remove('active'));
    const content = document.getElementById('ltab-' + tab);
    if (content) content.classList.add('active');
    if (el) el.classList.add('active');
}

function playLesson(id) {
    showToast(`🎬 Opening lesson: ${id.replace(/-/g, ' ')}...`, 'info');
}

function openLesson(id) {
    showToast(`📖 Opening learning module ${id}...`, 'info');
}

function updateChecklist() {
    document.querySelectorAll('.checklist-card').forEach(card => {
        const total = card.querySelectorAll('input[type=checkbox]').length;
        const done = card.querySelectorAll('input[type=checkbox]:checked').length;
        const prog = card.querySelector('.checklist-progress');
        if (prog) prog.textContent = `${done}/${total} Complete`;
    });
}

// ══════════════════════════════════════════════
//  ACHIEVEMENTS
// ══════════════════════════════════════════════
function showBadgeInfo(badge) {
    const info = {
        'first-drill': '🏚️ Earthquake Hero — Awarded for completing your first earthquake drill!',
        'speed': '⚡ Speed Runner — You evacuated in under 3 minutes. Lightning fast!',
        'knowledge': '🧠 Safety Scholar — Completed 5 learning modules. Knowledge is power!',
        'streak': '🔥 7-Day Streak — 7 consecutive days of safety training. Incredible!',
    };
    showToast(info[badge] || '🏅 Achievement unlocked!', 'success');
}

// ══════════════════════════════════════════════
//  DRILLS FILTER
// ══════════════════════════════════════════════
function filterDrills(filter, btn) {
    document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    document.querySelectorAll('.drill-card-full').forEach(card => {
        const status = card.dataset.status;
        if (filter === 'all') {
            card.style.display = '';
        } else if (filter === 'pending' && (status === 'pending' || status === 'in-progress')) {
            card.style.display = '';
        } else if (filter === 'completed' && status === 'completed') {
            card.style.display = '';
        } else {
            card.style.display = filter === 'all' ? '' : 'none';
        }
    });
}

// ══════════════════════════════════════════════
//  SEARCH
// ══════════════════════════════════════════════
function handleSearch(val) {
    if (val.length < 2) return;
    const lower = val.toLowerCase();
    if (lower.includes('drill') || lower.includes('earthquake') || lower.includes('fire') || lower.includes('flood')) {
        showToast('💡 Try the VR Drills section!', 'info');
    } else if (lower.includes('learn') || lower.includes('video') || lower.includes('lesson')) {
        showToast('💡 Check out the Learning Hub!', 'info');
    }
}

// ══════════════════════════════════════════════
//  TOAST
// ══════════════════════════════════════════════
function showToast(msg, type = 'info') {
    const container = document.getElementById('toastContainer');
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    const icons = { success: '✅', info: '💡', warning: '⚠️' };
    toast.innerHTML = `<span>${icons[type] || '💡'}</span><span>${msg}</span>`;
    container.appendChild(toast);
    setTimeout(() => toast.remove(), 3500);
}

// ══════════════════════════════════════════════
//  LOGOUT
// ══════════════════════════════════════════════
async function logout() {
    const token = localStorage.getItem('safeguard_token');
    if (token && !token.startsWith('demo-token-')) {
        try {
            await fetch(`${API_BASE}/auth/logout`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                body: JSON.stringify({ refreshToken: localStorage.getItem('safeguard_refresh') })
            });
        } catch (_) { }
    }
    localStorage.removeItem('safeguard_token');
    localStorage.removeItem('safeguard_refresh');
    localStorage.removeItem('safeguard_user');
    window.location.href = 'login.html';
}

// Close modals on Escape
document.addEventListener('keydown', e => {
    if (e.key === 'Escape') { closeSOS(); closeDrillModal(); closeQuizModal(); }
});

// ══════════════════════════════════════════════
//  QUIZ SYSTEM
// ══════════════════════════════════════════════
const quizData = {
    module1: {
        title: "Introduction to Disaster Preparedness",
        questions: [
            {
                q: "What is the primary goal of disaster preparedness?",
                a: ["To stop all disasters from happening", "To minimize the impact and ensure quick recovery", "To replace government emergency services", "To build flood-proof cities only"],
                correct: 1
            },
            {
                q: "In disaster management, what does 'Risk' refer to?",
                a: ["The probability of a hazard occurring and its impact", "Only the severity of a natural event", "The cost of building a shelter", "A type of insurance policy"],
                correct: 0
            },
            {
                q: "How is 'Vulnerability' best defined?",
                a: ["The amount of rainfall during a storm", "The strength of a building's foundation", "The degree to which a person or community is susceptible to harm", "The speed of an evacuation"],
                correct: 2
            },
            {
                q: "What is 'Community Resilience'?",
                a: ["The wealth of a community", "The ability of a community to rebound from disaster", "The size of the local police force", "Having high walls around a city"],
                correct: 1
            },
            {
                q: "Which of these is considered a 'Natural Hazard'?",
                a: ["Chemical spill", "Cyber attack", "Tectonic plate movement", "Traffic jam"],
                correct: 2
            },
            {
                q: "Disaster risk is generally seen as a combination of:",
                a: ["Hazards, Vulnerability, and Exposure", "Wind, Rain, and Fire", "Money and Planning", "Luck and Timing"],
                correct: 0
            },
            {
                q: "Which group is often considered most vulnerable during a disaster?",
                a: ["Emergency responders", "High-income earners", "Children and elderly without support", "Government officials"],
                correct: 2
            },
            {
                q: "Which factor significantly increases community resilience?",
                a: ["High population density", "Robust communication and local safety networks", "Building in flood zones", "Ignoring early warning signs"],
                correct: 1
            },
            {
                q: "Which of the following is an example of a 'Man-made Disaster'?",
                a: ["Flash flood", "Industrial gas leak", "Severe drought", "Solar flare"],
                correct: 1
            },
            {
                q: "What is typically the first step in creating a personal disaster plan?",
                a: ["Buying a 5-year supply of food", "Identifying the specific risks in your local area", "Buying a new car for evacuation", "Calling the news station"],
                correct: 1
            }
        ]
    },
    module2: {
        title: "Earthquake Preparedness & Response",
        questions: [
            {
                q: "What is the recommended universal action when you feel earthquake shaking?",
                a: ["Run outside as fast as possible", "Drop, Cover, and Hold On", "Stand in a doorway", "Find an elevator to go down"],
                correct: 1
            },
            {
                q: "Why is it dangerous to stand near windows during seismic activity?",
                a: ["Windows attract lightning", "Glass may shatter inward causing severe injury", "Windows increase the shaking magnitude", "The view might be distracting"],
                correct: 1
            },
            {
                q: "What defines a 'Structurally Safe' building in an earthquake zone?",
                a: ["It is made entirely of glass", "It can sway slightly to absorb seismic energy without collapsing", "It is built on top of a hill", "It has no windows"],
                correct: 1
            },
            {
                q: "Which item is most critical in an earthquake emergency kit for signaling?",
                a: ["A mirror", "A whistle", "A heavy blanket", "Extra water"],
                correct: 1
            },
            {
                q: "If you are outdoors when shaking starts, the safest location is:",
                a: ["Under a tall tree", "In an open area away from buildings and power lines", "Near a brick wall", "Directly under a street lamp"],
                correct: 1
            },
            {
                q: "What is the most common secondary hazard after a major earthquake?",
                a: ["Volcanic eruption", "Fires from broken gas lines", "Heavy snowfall", "Solar radiation"],
                correct: 1
            },
            {
                q: "Why should elevators be avoided during and after an earthquake?",
                a: ["They move too slowly", "Potential power failure or mechanical snagging can trap you", "They are reserved for pets", "They increase the shaking intensity"],
                correct: 1
            },
            {
                q: "Once the shaking stops, your very first priority should be:",
                a: ["Cleaning up broken glass", "Checking yourself and others for injuries", "Taking photos for social media", "Checking the internet"],
                correct: 1
            },
            {
                q: "If you are in bed when an earthquake occurs, you should:",
                a: ["Try to run to the kitchen", "Stay there and protect your head with a pillow", "Roll under the bed", "Jump out the window"],
                correct: 1
            },
            {
                q: "A safe 'Assembly Point' after an evacuation should be:",
                a: ["Directly next to the building exit", "Inside a large garage", "An open space far from falling hazards", "In the basement"],
                correct: 2
            }
        ]
    },
    module3: {
        title: "Fire Safety & Evacuation",
        questions: [
            {
                q: "In the RACE protocol, what is the first priority 'R'?",
                a: ["Run for help", "Rescue anyone in immediate danger", "Ring the fire department", "Report the damage"],
                correct: 1
            },
            {
                q: "What does the 'A' in RACE stand for?",
                a: ["Aim the nozzle", "Apply water", "Activate the alarm", "Assemble at the point"],
                correct: 2
            },
            {
                q: "A Class B fire involves which of the following?",
                a: ["Ordinary combustibles (wood, paper)", "Flammable liquids (gasoline, grease)", "Electrical equipment", "Combustible metals"],
                correct: 1
            },
            {
                q: "The 'C' in RACE stands for 'Confine'. How is this typically done?",
                a: ["Breaking windows", "Closing doors and windows", "Turning on fans", "Using a blanket"],
                correct: 1
            },
            {
                q: "What is the correct meaning of the PASS acronym for extinguisher use?",
                a: ["Pull, Aim, Squeeze, Sweep", "Push, Activate, Spray, Stop", "Pull, Arm, Spray, Slide", "Push, Aim, Squeeze, Shake"],
                correct: 0
            },
            {
                q: "Which fire class involves energized electrical equipment?",
                a: ["Class A", "Class B", "Class C", "Class K"],
                correct: 2
            },
            {
                q: "When using an extinguisher (PASS), where should you aim the nozzle?",
                a: ["At the top of the flames", "At the base of the fire", "In a circular motion above the fire", "At the smoke"],
                correct: 1
            },
            {
                q: "What color code is typically associated with a CO2 fire extinguisher?",
                a: ["Red", "Cream", "Black", "Blue"],
                correct: 2
            },
            {
                q: "Which extinguisher type is best for multiple fire classes (A, B, and C)?",
                a: ["Water", "Dry Chemical Powder", "Wet Chemical", "Foam"],
                correct: 1
            },
            {
                q: "If your clothes catch fire, what is the safest immediate action?",
                a: ["Run to the nearest water source", "Stop, Drop, and Roll", "Take the clothes off quickly", "Wave your arms to put it out"],
                correct: 1
            }
        ]
    },
    module4: {
        title: "Flood & Water Emergency Response",
        questions: [
            {
                q: "What is the primary difference between a Flood Watch and a Flood Warning?",
                a: ["There is no difference", "A Watch means flooding is possible; a Warning means it is occurring or imminent", "A Warning means rain is forecast; a Watch means it is raining", "A Watch is for coastal areas; a Warning is for inland"],
                correct: 1
            },
            {
                q: "How many inches of fast-moving water can knock an adult off their feet?",
                a: ["6 inches", "12 inches", "2 feet", "4 feet"],
                correct: 0
            },
            {
                q: "What is the safest action if you encounter a flooded road while driving?",
                a: ["Drive through it quickly", "Turn Around, Don't Drown", "Flash your lights and proceed slowly", "Wait for a larger vehicle to lead the way"],
                correct: 1
            },
            {
                q: "Why is it dangerous to walk through floodwaters even if they look shallow?",
                a: ["They could be contaminated with pathogens", "There could be hidden sharp debris or open manholes", "Hidden electrical charges from downed power lines", "All of the above"],
                correct: 3
            },
            {
                q: "What is a 'Flash Flood'?",
                a: ["A flood that lasts for weeks", "A rapid flooding of low-lying areas, usually caused by heavy rain in under 6 hours", "A type of flood only found at the beach", "A flood caused by a kitchen leak"],
                correct: 1
            },
            {
                q: "If you are trapped in a building during a flood, you should move to:",
                a: ["The basement", "The highest possible level, but avoid enclosed attics", "The garage", "The kitchen"],
                correct: 1
            },
            {
                q: "Which color code typically represents the highest level of Flood Alert?",
                a: ["Yellow", "Orange", "Red", "Blue"],
                correct: 2
            },
            {
                q: "Why should you boil water before drinking it after a flood event?",
                a: ["To make it taste better", "To kill bacteria and pathogens introduced by flood contamination", "To warm up the house", "To remove chemicals"],
                correct: 1
            },
            {
                q: "Before returning to a flood-damaged home, your first priority should be:",
                a: ["Taking photos for insurance", "Ensuring structural and electrical safety by professionals", "Opening all the windows", "Starting the cleanup immediately"],
                correct: 1
            },
            {
                q: "Which documentation remains most critical in a waterproof emergency container?",
                a: ["Old newspapers", "Graduation photos", "Identification, medical records, and insurance policies", "Magazine subscriptions"],
                correct: 2
            }
        ]
    },
    module5: {
        title: "Medical First Response",
        questions: [
            {
                q: "In mass casualty triage, what does the 'Red' tag signify?",
                a: ["Deceased", "Delayed (Minor injuries)", "Immediate (Life-threatening injuries)", "Minor (Walking wounded)"],
                correct: 2
            },
            {
                q: "What is the recommended ratio of compressions to breaths for adult CPR?",
                a: ["15 compressions : 2 breaths", "30 compressions : 2 breaths", "50 compressions : 5 breaths", "10 compressions : 1 breath"],
                correct: 1
            },
            {
                q: "When performing high-quality CPR, what is the target compression rate per minute?",
                a: ["60–80 per minute", "80–100 per minute", "100–120 per minute", "Over 150 per minute"],
                correct: 2
            },
            {
                q: "What is the first thing you should do when encountering an unconscious person?",
                a: ["Start chest compressions", "Check the scene for safety", "Call for an AED", "Give rescue breaths"],
                correct: 1
            },
            {
                q: "In the 'ABC' survey of first aid, what does 'B' stand for?",
                a: ["Bleeding", "Breathing", "Broken bones", "Body temperature"],
                correct: 1
            },
            {
                q: "What is the most effective initial method to control severe external bleeding?",
                a: ["Applying a tourniquet immediately", "Applying direct pressure to the wound", "Elevating the limb only", "Using a hot compress"],
                correct: 1
            },
            {
                q: "When should you apply a tourniquet?",
                a: ["For any small cut", "Only when direct pressure fails to stop life-threatening bleeding on a limb", "To prevent a limb from swelling", "Before checking the wound"],
                correct: 1
            },
            {
                q: "What information is most important to give an emergency dispatcher?",
                a: ["The color of the victim's clothes", "Exact location, number of victims, and nature of the emergency", "Your personal medical history", "Names of all witnesses"],
                correct: 1
            },
            {
                q: "A victim who can walk but has minor injuries is categorized in triage as:",
                a: ["Red (Immediate)", "Yellow (Delayed)", "Green (Minor/Walking Wounded)", "Black (Expectant)"],
                correct: 2
            },
            {
                q: "Where should hands be placed for adult chest compressions?",
                a: ["On the upper neck", "On the center of the chest, on the lower half of the breastbone", "On the stomach", "To the left side over the heart"],
                correct: 1
            }
        ]
    }
};

let currentQuiz = null;
let quizState = {
    index: 0,
    score: 0,
    userAnswers: []
};

function openLesson(id) {
    if (quizData[id]) {
        startQuiz(id);
    } else {
        showToast(`📖 Opening learning module ${id}...`, 'info');
    }
}

function startQuiz(moduleId) {
    currentQuiz = quizData[moduleId];
    quizState = { index: 0, score: 0, userAnswers: [], moduleId };
    renderQuizQuestion();
    document.getElementById('quizModal').classList.add('open');
}

function closeQuizModal() {
    document.getElementById('quizModal').classList.remove('open');
}

function renderQuizQuestion() {
    const qBody = document.getElementById('quizModalBody');
    const question = currentQuiz.questions[quizState.index];
    const progress = Math.round(((quizState.index + 1) / currentQuiz.questions.length) * 100);

    qBody.innerHTML = `
        <div style="margin-bottom: 20px;">
            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:10px;">
                <h4 style="color:var(--blue); font-size: 0.9rem; text-transform:uppercase; letter-spacing:1px;">Question ${quizState.index + 1}/${currentQuiz.questions.length}</h4>
                <span style="font-size:0.8rem; color:var(--muted)">${progress}% Complete</span>
            </div>
            <div class="drill-progress-bar" style="height:6px; margin-bottom:20px;">
                <div class="drill-progress-fill" style="width: ${progress}%; background:var(--blue)"></div>
            </div>
            <h2 style="font-size: 1.3rem; line-height:1.4; margin-bottom:24px;">${question.q}</h2>
        </div>
        <div style="display:flex; flex-direction:column; gap:12px; margin-bottom:24px;">
            ${question.a.map((ans, i) => `
                <button onclick="handleAnswer(${i})" class="quiz-option-btn card-glass" style="text-align:left; padding:16px 20px; border-radius:12px; border:1px solid rgba(255,255,255,0.1); background:rgba(255,255,255,0.03); color:var(--text); cursor:pointer; font-size:0.95rem; transition:0.2s;">
                    ${ans}
                </button>
            `).join('')}
        </div>
    `;

    // Add hover effect via JS styling or class if defined
    document.querySelectorAll('.quiz-option-btn').forEach(btn => {
        btn.onmouseover = () => btn.style.borderColor = 'var(--blue)';
        btn.onmouseout = () => btn.style.borderColor = 'rgba(255,255,255,0.1)';
    });
}

function handleAnswer(index) {
    const question = currentQuiz.questions[quizState.index];
    if (index === question.correct) {
        quizState.score++;
        showToast("Correct!", "success");
    } else {
        showToast("Incorrect", "warning");
    }

    quizState.index++;
    if (quizState.index < currentQuiz.questions.length) {
        renderQuizQuestion();
    } else {
        renderQuizResults();
    }
}

function renderQuizResults() {
    const qBody = document.getElementById('quizModalBody');
    const pct = Math.round((quizState.score / currentQuiz.questions.length) * 100);
    const xpReward = Math.round((quizState.score / currentQuiz.questions.length) * 200);

    qBody.innerHTML = `
        <div style="text-align:center; padding: 20px 0;">
            <div style="font-size: 4rem; margin-bottom: 16px;">${pct >= 70 ? '🎉' : '📚'}</div>
            <h2 style="font-size: 1.8rem; margin-bottom: 8px;">Assessment Complete!</h2>
            <p style="color:var(--muted); margin-bottom: 30px;">You scored ${quizState.score} out of ${currentQuiz.questions.length}</p>
            
            <div class="card-glass" style="padding:24px; border-radius:16px; margin-bottom:30px; border:1px solid rgba(255,255,255,0.1);">
                <h1 style="font-size: 3.5rem; color:${pct >= 70 ? 'var(--green)' : 'var(--blue)'}; margin-bottom:0;">${pct}%</h1>
                <p style="text-transform:uppercase; font-size:0.8rem; letter-spacing:2px; margin-top:5px;">Accuracy</p>
            </div>

            <div style="display:flex; gap:15px; justify-content:center; margin-bottom:30px;">
                <div class="card-glass" style="padding:12px 20px; border-radius:12px; border:1px solid rgba(255,255,255,0.05)">
                    <span style="display:block; font-size:1.2rem; font-weight:700; color:var(--gold)">+${xpReward}</span>
                    <small style="color:var(--muted)">XP Points</small>
                </div>
                <div class="card-glass" style="padding:12px 20px; border-radius:12px; border:1px solid rgba(255,255,255,0.05)">
                    <span style="display:block; font-size:1.2rem; font-weight:700; color:var(--blue)">+5%</span>
                    <small style="color:var(--muted)">Preparedness</small>
                </div>
            </div>

            <div style="display:flex; gap:12px;">
                <button onclick="closeQuizModal()" class="drill-btn-primary" style="flex:1; padding:16px; border-radius:12px;">Finish Assessment</button>
                ${pct < 100 ? `<button onclick="startQuiz('${quizState.moduleId}')" style="padding:16px 24px; border-radius:12px; background:rgba(255,255,255,0.05); border:1px solid rgba(255,255,255,0.1); color:var(--text); cursor:pointer;">Retry</button>` : ''}
            </div>
        </div>
    `;

    // Award XP and Preparedness logic (Backend integration placeholder)
    if (pct >= 70) {
        showToast(`Earned ${xpReward} XP for Assessment!`, "success");
    }
}
