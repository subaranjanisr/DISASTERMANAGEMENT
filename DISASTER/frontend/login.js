// ============================================================
// SAFEGUARD - Login Page JavaScript
// Connects to backend API; defaults to localhost:5000 during development
// ============================================================

// Use the current origin when possible so the frontend can be served
// from the same host as the API. This avoids CORS issues when using a
// static server or deploying both layers together.
const API_BASE = (() => {
    const origin = window.location.origin;
    // if running via file:// origin will be "null", so fall back to localhost
    if (origin && origin !== 'null' && origin !== 'file://') {
        return `${origin}/api/v1`;
    }
    return 'http://localhost:5000/api/v1';
})();

// -------------------------------------------------------
// Screen Navigation
// -------------------------------------------------------
function showLogin(role) {
    document.getElementById('roleScreen').classList.remove('active');
    if (role === 'student') {
        document.getElementById('studentScreen').classList.add('active');
    } else if (role === 'admin') {
        document.getElementById('adminScreen').classList.add('active');
    }
}

function showRole() {
    document.getElementById('studentScreen').classList.remove('active');
    document.getElementById('adminScreen').classList.remove('active');
    document.getElementById('roleScreen').classList.add('active');
}

// -------------------------------------------------------
// Password Toggle
// -------------------------------------------------------
function togglePassword(inputId) {
    const input = document.getElementById(inputId);
    const button = input.parentElement.querySelector('.toggle-password');
    if (input.type === 'password') {
        input.type = 'text';
        button.textContent = '';
    } else {
        input.type = 'password';
        button.textContent = '';
    }
}

// -------------------------------------------------------
// Form Validation
// -------------------------------------------------------
function validateEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

// -------------------------------------------------------
// Handle Login — calls real backend API
// -------------------------------------------------------
// quick health check before attempting any login request
async function checkServer() {
    try {
        const resp = await fetch(`${API_BASE}/health`);
        return resp.ok;
    } catch (e) {
        return false;
    }
}

async function handleLogin(event, role) {
    event.preventDefault();

    if (!(await checkServer())) {
        showError('Unable to reach backend API. Ensure it is running on port 5000 and that CORS/origin settings allow this page.');
        return;
    }

    let email, password;

    if (role === 'student') {
        email = document.getElementById('studentEmail').value.trim();
        password = document.getElementById('studentPassword').value;
    } else {
        email = document.getElementById('adminEmail').value.trim();
        password = document.getElementById('adminPassword').value;
    }

    if (!email || !password) {
        showError('Please fill in all fields.');
        return;
    }

    if (!validateEmail(email)) {
        showError('Please enter a valid email address.');
        return;
    }

    // Show loading state on submit button
    const submitBtn = event.target.querySelector('button[type="submit"]');
    const originalContent = submitBtn.innerHTML;
    submitBtn.innerHTML = '<span>Logging in...</span><span class="spinner">⏳</span>';
    submitBtn.disabled = true;

    try {
        const response = await fetch(`${API_BASE}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify({ email, password }),
        });

        const data = await response.json();

        if (response.ok && data.success) {
            // Verify the returned role matches the selected role
            if (data.user.role !== role && !(role === 'admin' && data.user.role === 'superadmin')) {
                showError(`This account is registered as a "${data.user.role}". Please select the correct role.`);
                submitBtn.innerHTML = originalContent;
                submitBtn.disabled = false;
                return;
            }

            // Save auth session
            localStorage.setItem('safeguard_token', data.accessToken);
            localStorage.setItem('safeguard_refresh', data.refreshToken);
            localStorage.setItem('safeguard_user', JSON.stringify(data.user));

            // Show success modal and redirect
            showSuccessModal(data.user);
        } else {
            // Handle specific error messages from backend
            const msg = data.message || 'Invalid credentials. Please try again.';
            if (data.attemptsLeft !== undefined) {
                showError(`${msg} (${data.attemptsLeft} attempts remaining)`);
            } else {
                showError(msg);
            }
        }
    } catch (err) {
        console.error('Login error:', err);
        showError('Server error: ' + (err.message || `Cannot connect to backend at ${API_BASE}. Make sure the API is running.`));
    } finally {
        submitBtn.innerHTML = originalContent;
        submitBtn.disabled = false;
    }
}

// -------------------------------------------------------
// Show Success Modal + Redirect to Dashboard
// -------------------------------------------------------
function showSuccessModal(user) {
    const modal = document.getElementById('successModal');
    const message = document.getElementById('successMessage');

    const dashboardName = (user.role === 'student') ? 'Student Dashboard' : 'Admin Dashboard';
    message.textContent = `Welcome back, ${user.firstName}! Redirecting to ${dashboardName}...`;
    modal.classList.add('active');

    setTimeout(() => {
        modal.classList.remove('active');

        if (user.role === 'student') {
            // Populate dashboard with real user data and show it
            populateStudentDashboard(user);
            document.querySelector('.container').style.display = 'none';
            document.getElementById('studentDashboard').classList.add('active');
            initDashboard();
        } else {
            // Redirect to admin dashboard page
            window.location.href = 'admin-dashboard.html';
        }
    }, 1800);
}

// -------------------------------------------------------
// Populate Student Dashboard with Real User Data
// -------------------------------------------------------
function populateStudentDashboard(user) {
    const firstName = user.firstName || 'Student';
    const score = user.preparednessScore || 0;
    const xp = user.xpPoints || 0;
    const level = user.level || 1;
    const streak = user.streak || 0;

    // Update name references
    document.querySelectorAll('.user-info .name').forEach(el => el.textContent = firstName);
    document.querySelectorAll('.welcome-text .gradient-text').forEach(el => el.textContent = firstName);
    document.querySelectorAll('.chat-area .msg.ai').forEach(el => {
        el.textContent = `Hello ${firstName}! Ready to continue your preparedness training?`;
    });

    // Update level badge
    const levelLabels = ['', 'Novice', 'Learner', 'Prepared', 'Responder', 'Hero', 'Guardian'];
    document.querySelectorAll('.user-info .level').forEach(el => {
        el.textContent = `Level ${level} ${levelLabels[level] || ''}`;
    });

    // Update preparedness score circle
    document.querySelectorAll('.score-circle span').forEach(el => el.textContent = `${score}%`);
    document.querySelectorAll('.score-circle').forEach(el => {
        el.style.setProperty('--percent', score);
    });

    // Update stat cards
    const statValues = document.querySelectorAll('.stat-value');
    if (statValues.length >= 3) {
        statValues[1].textContent = `${xp} XP`;
        statValues[2].textContent = level;
        statValues[3].textContent = `${streak} Day${streak !== 1 ? 's' : ''}`;
    }

    // Update welcome message
    const welcomeP = document.querySelector('.welcome-text p');
    if (welcomeP) {
        if (score === 0) {
            welcomeP.textContent = "Welcome! Complete your first drill to start building your score.";
        } else if (score < 50) {
            welcomeP.textContent = `You are ${score}% ready. Keep training to improve!`;
        } else {
            welcomeP.textContent = `You are ${score}% ready for any disaster. Let's reach 100%!`;
        }
    }

    // Update avatar 
    const avatarImg = document.querySelector('#studentDashboard .avatar img');
    if (avatarImg && user.avatar) {
        avatarImg.src = user.avatar;
    } else if (avatarImg) {
        avatarImg.src = `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.id || firstName}`;
    }
}

// -------------------------------------------------------
// Show Error Modal
// -------------------------------------------------------
function showError(message) {
    const modal = document.getElementById('errorModal');
    const errorMessage = document.getElementById('errorMessage');
    errorMessage.textContent = message;
    modal.classList.add('active');
}

// -------------------------------------------------------
// Close Modal
// -------------------------------------------------------
function closeModal() {
    document.getElementById('errorModal').classList.remove('active');
    document.getElementById('successModal').classList.remove('active');
}

// -------------------------------------------------------
// Dashboard Init & Drill Functions
// -------------------------------------------------------
function initDashboard() {
    console.log('🛡️ SAFEGUARD Student Dashboard Initialized');
    // Fetch live dashboard data from API
    fetchStudentDashboard();
}

async function fetchStudentDashboard() {
    const token = localStorage.getItem('safeguard_token');
    if (!token) return;

    try {
        const res = await fetch(`${API_BASE}/students/dashboard`, {
            headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) {
            const data = await res.json();
            if (data.success && data.dashboard) {
                updateDashboardStats(data.dashboard);
            }
        }
    } catch (err) {
        console.warn('Could not fetch live dashboard data:', err.message);
    }
}

function updateDashboardStats(dashboard) {
    const { drills, achievements } = dashboard;

    // Update drills stat
    const drillsEl = document.querySelector('.stat-card:nth-child(2) .stat-value');
    if (drillsEl && drills) {
        drillsEl.textContent = `${drills.completed}/${drills.total}`;
    }

    // Update achievements
    const achEl = document.querySelector('.stat-card:nth-child(3) .stat-value');
    if (achEl && achievements) {
        achEl.textContent = achievements.total;
    }
}

function startDrill(type) {
    const drills = {
        earthquake: "🏚️ Starting Earthquake Simulation...\nScenario: Classroom during magnitude 7.0.\nObjective: DROP, COVER, HOLD ON.",
        fire: "🔥 Resuming Fire Evacuation Drill...\nObjective: Reach the assembly point in under 3 minutes.",
        flood: "🌊 Initializing Flood Response...\nLoading 3D Environment... Stand by!"
    };
    alert(drills[type] || "Starting Drill...");
}

// -------------------------------------------------------
// Logout
// -------------------------------------------------------
async function logout() {
    const token = localStorage.getItem('safeguard_token');
    const refreshToken = localStorage.getItem('safeguard_refresh');

    // Call logout API to revoke refresh token
    if (token) {
        try {
            await fetch(`${API_BASE}/auth/logout`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({ refreshToken }),
            });
        } catch (err) {
            console.warn('Logout API call failed:', err.message);
        }
    }

    // Clear session data
    localStorage.removeItem('safeguard_token');
    localStorage.removeItem('safeguard_refresh');
    localStorage.removeItem('safeguard_user');

    window.location.reload();
}

// -------------------------------------------------------
// Forgot Password
// -------------------------------------------------------
async function forgotPassword(role) {
    const emailInput = document.getElementById(role === 'student' ? 'studentEmail' : 'adminEmail');
    const email = emailInput ? emailInput.value.trim() : '';

    let userEmail = email;
    if (!userEmail || !validateEmail(userEmail)) {
        userEmail = prompt('Enter your registered email address:');
        if (!userEmail) return;
    }

    try {
        const res = await fetch(`${API_BASE}/auth/forgot-password`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: userEmail }),
        });
        const data = await res.json();
        alert(data.message || 'If that email exists, a reset link has been sent.');
    } catch {
        alert('Unable to reach server. Please try again later.');
    }
}

// -------------------------------------------------------
// AI Chatbot
// -------------------------------------------------------
document.querySelector('.chat-input button')?.addEventListener('click', sendChatMessage);
document.querySelector('.chat-input input')?.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') sendChatMessage();
});

function sendChatMessage() {
    const input = document.querySelector('.chat-input input');
    const chatArea = document.querySelector('.chat-area');
    const text = input.value.trim();
    if (!text) return;
    addMessage(text, 'user');
    input.value = '';
    chatArea.scrollTop = chatArea.scrollHeight;

    // Simulate AI response
    setTimeout(() => {
        const responses = [
            "Great question! Remember: Drop, Cover, and Hold On during earthquakes.",
            "For fire emergencies: stay low, check doors for heat, use nearest exit!",
            "I can help you review your drill performance. Check the Drills section.",
            "Make sure to have an emergency kit with 3 days of supplies ready.",
            "During floods, move to higher ground immediately and avoid moving water.",
        ];
        const r = responses[Math.floor(Math.random() * responses.length)];
        addMessage(r, 'ai');
        chatArea.scrollTop = chatArea.scrollHeight;
    }, 1000);
}

function addMessage(text, sender) {
    const chatArea = document.querySelector('.chat-area');
    const div = document.createElement('div');
    div.className = `msg ${sender}`;
    div.textContent = text;
    chatArea.appendChild(div);
}

// -------------------------------------------------------
// Notifications & SOS
// -------------------------------------------------------
function toggleNotifications() {
    const panel = document.getElementById('notificationsPanel');
    if (panel) panel.classList.toggle('active');
}

document.addEventListener('click', (e) => {
    const panel = document.getElementById('notificationsPanel');
    const btn = document.querySelector('.notification-btn');
    if (panel && btn && panel.classList.contains('active')) {
        if (!panel.contains(e.target) && !btn.contains(e.target)) {
            panel.classList.remove('active');
        }
    }
});

function toggleSOS() {
    const modal = document.getElementById('sosModal');
    if (modal) modal.classList.toggle('active');
}

document.addEventListener('click', (e) => {
    if (e.target.closest('.sos-btn')) toggleSOS();
});

function showGuide(type) {
    const guides = {
        fire: "🔥 FIRE EMERGENCY:\n1. Stay low to the ground.\n2. Check doors for heat before opening.\n3. Use nearest exit (not elevators).\n4. Meet at the assembly point.",
        flood: "🌊 FLOOD EMERGENCY:\n1. Move to higher ground immediately.\n2. Do NOT walk through moving water.\n3. Disconnect electrical appliances if safe.\n4. Call emergency services.",
        earthquake: "🏚️ EARTHQUAKE SAFETY:\n1. DROP to your hands and knees.\n2. COVER your head/neck under a sturdy table.\n3. HOLD ON until shaking stops.\n4. Evacuate after shaking stops.",
        medical: "🏥 MEDICAL EMERGENCY:\n1. Call 911 or Campus Security immediately.\n2. Check for breathing and pulse.\n3. Apply pressure to any bleeding.\n4. Do not move the person if spinal injury suspected."
    };
    if (guides[type]) alert(guides[type]);
}

// -------------------------------------------------------
// Modal Controls
// -------------------------------------------------------
window.addEventListener('click', (e) => {
    if (e.target.classList.contains('modal')) closeModal();
});

document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') closeModal();
});

// -------------------------------------------------------
// Ripple Effect on Buttons
// -------------------------------------------------------
document.addEventListener('DOMContentLoaded', () => {
    console.log('🛡️ SAFEGUARD Auth System Loaded — API:', API_BASE);

    // Auto-restore session if logged in
    const saved = localStorage.getItem('safeguard_user');
    const token = localStorage.getItem('safeguard_token');
    if (saved && token) {
        try {
            const user = JSON.parse(saved);
            if (user.role === 'student') {
                populateStudentDashboard(user);
                document.querySelector('.container').style.display = 'none';
                document.getElementById('studentDashboard').classList.add('active');
                initDashboard();
            }
        } catch (_) {
            localStorage.clear();
        }
    }

    // Attach ripple to buttons
    document.querySelectorAll('.btn').forEach((btn) => {
        btn.addEventListener('click', function (e) {
            const ripple = document.createElement('span');
            const rect = this.getBoundingClientRect();
            const size = Math.max(rect.width, rect.height);
            ripple.style.cssText = `
                width: ${size}px; height: ${size}px;
                left: ${e.clientX - rect.left - size / 2}px;
                top: ${e.clientY - rect.top - size / 2}px;
                position: absolute; border-radius: 50%;
                background: rgba(255,255,255,0.4);
                transform: scale(0); animation: ripple 0.6s ease-out;
                pointer-events: none;
            `;
            this.style.position = 'relative';
            this.style.overflow = 'hidden';
            this.appendChild(ripple);
            setTimeout(() => ripple.remove(), 600);
        });
    });
});

// Add ripple keyframe animation
const rippleStyle = document.createElement('style');
rippleStyle.textContent = `@keyframes ripple { to { transform: scale(4); opacity: 0; } }`;
document.head.appendChild(rippleStyle);
