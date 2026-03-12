/**
 * SAFEGUARD - Admin Dashboard Logic
 * Advanced Student Monitoring & Analytics
 */

const API_BASE = 'http://localhost:5000/api/v1';

document.addEventListener('DOMContentLoaded', () => {
    checkAdminAuth();
    loadAdminData();

    // Set current date
    const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    document.getElementById('currentDate').textContent = new Date().toLocaleDateString('en-US', options);

    // Initial table setup for students
    setupStudentSearch();
});

function checkAdminAuth() {
    const token = localStorage.getItem('safeguard_token');
    const userStr = localStorage.getItem('safeguard_user');

    if (!token || !userStr) {
        window.location.href = 'login.html';
        return;
    }

    const user = JSON.parse(userStr);
    if (user.role !== 'admin' && user.role !== 'superadmin') {
        window.location.href = 'login.html?error=unauthorized';
        return;
    }

    // Populate profile
    document.getElementById('adminName').textContent = user.firstName + ' ' + user.lastName;
    document.getElementById('adminInstitution').textContent = user.institution || 'Administrator';
    document.getElementById('adminAvatar').textContent = user.firstName.charAt(0);
}

/**
 * Tab Navigation Logic
 */
function showTab(tabId) {
    // Hide all tabs
    document.querySelectorAll('.dashboard-tab').forEach(tab => {
        tab.style.display = 'none';
    });

    // Deactivate all nav items
    document.querySelectorAll('.nav-item').forEach(item => {
        item.classList.remove('active');
    });

    // Show selected tab
    document.getElementById(tabId).style.display = 'block';

    // Activate corresponding nav item
    if (tabId === 'overviewTab') {
        document.getElementById('navOverview').classList.add('active');
        document.getElementById('welcomeHeader').textContent = 'Admin Overview';
    } else if (tabId === 'studentsTab') {
        document.getElementById('navStudents').classList.add('active');
        document.getElementById('welcomeHeader').textContent = 'Student Management';
        loadStudentsTab();
    } else if (tabId === 'drillsTab') {
        document.getElementById('navDrills').classList.add('active');
        document.getElementById('welcomeHeader').textContent = 'Drill Analytics';
    } else if (tabId === 'settingsTab') {
        document.getElementById('navSettings').classList.add('active');
        document.getElementById('welcomeHeader').textContent = 'Institutional Settings';
    }
}

/**
 * Settings Sub-Category Switching
 */
function switchSettingsCategory(categoryId) {
    // Deactivate all pane buttons
    document.querySelectorAll('.s-nav-item').forEach(btn => btn.classList.remove('active'));

    // Hide all panes
    document.querySelectorAll('.settings-pane').forEach(pane => pane.classList.remove('active'));

    // Activate selected
    const activeBtn = Array.from(document.querySelectorAll('.s-nav-item')).find(btn => btn.innerText.toLowerCase().includes(categoryId));
    if (activeBtn) activeBtn.classList.add('active');

    document.getElementById(`settings-${categoryId}`).classList.add('active');
}


async function loadAdminData() {
    const token = localStorage.getItem('safeguard_token');

    // Demo mode — token starts with 'demo-token-'
    if (token && token.startsWith('demo-token-')) {
        updateDashboardUI({
            totalStudents: 128,
            activeStudentsThisWeek: 47,
            avgPreparednessScore: 72,
            drills: { earthquake: 34, fire: 28, flood: 19 },
            recentRegistrations: [
                { firstName: 'Arjun', lastName: 'Sharma', email: 'arjun@demo.edu', institution: 'Demo University', preparednessScore: 88, createdAt: new Date().toISOString() },
                { firstName: 'Priya', lastName: 'Patel', email: 'priya@demo.edu', institution: 'Demo University', preparednessScore: 76, createdAt: new Date().toISOString() },
                { firstName: 'Rahul', lastName: 'Mehta', email: 'rahul@demo.edu', institution: 'Demo University', preparednessScore: 61, createdAt: new Date().toISOString() },
                { firstName: 'Sneha', lastName: 'Iyer', email: 'sneha@demo.edu', institution: 'Demo University', preparednessScore: 95, createdAt: new Date().toISOString() },
            ],
        });
        return;
    }

    try {
        const response = await fetch(`${API_BASE}/admin/dashboard`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });

        const data = await response.json();
        if (response.ok && data.success) {
            updateDashboardUI(data.analytics);
        }
    } catch (err) {
        console.error('Network error loading admin data:', err);
    }
}

function updateDashboardUI(analytics) {
    // Overview Stats
    document.getElementById('statTotalStudents').textContent = analytics.totalStudents || 0;
    document.getElementById('statActiveStudents').textContent = analytics.activeStudentsThisWeek || 0;
    document.getElementById('statAvgScore').textContent = (analytics.avgPreparednessScore || 0) + '%';

    const totalDrills = Object.values(analytics.drills || {}).reduce((a, b) => a + b, 0);
    document.getElementById('statDrillsCompleted').textContent = totalDrills;

    // Recent Students Table
    const tableBody = document.querySelector('#recentStudentsTable tbody');
    tableBody.innerHTML = '';

    if (analytics.recentRegistrations && analytics.recentRegistrations.length > 0) {
        analytics.recentRegistrations.forEach(student => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>
                    <div class="student-cell">
                        <p class="s-name">${student.firstName} ${student.lastName}</p>
                        <p class="s-email">${student.email}</p>
                    </div>
                </td>
                <td><span class="status-badge status-active">Active</span></td>
                <td>${student.institution || 'N/A'}</td>
                <td><strong>${student.preparednessScore || 0}%</strong></td>
                <td>${new Date(student.createdAt).toLocaleDateString()}</td>
            `;
            tableBody.appendChild(row);
        });
    } else {
        tableBody.innerHTML = '<tr><td colspan="5" style="text-align:center; padding: 40px;">No recent students found.</td></tr>';
    }
}

/**
 * Students Tab Logic
 */
function loadStudentsTab() {
    // Fill Mini Stats
    document.getElementById('tileTotalStudents').textContent = '128';
    document.getElementById('tileActiveUsers').textContent = '24';
    document.getElementById('tileDrillCompletion').textContent = '68%';
    document.getElementById('tileAvgPreparedness').textContent = '72%';

    // Load Student List (Demo Data)
    const students = [
        { name: 'Arjun Sharma', email: 'arjun@safeguard.in', score: 88, status: 'Live VR', joined: '12 Mar 2026' },
        { name: 'Priya Patel', email: 'priya@safeguard.in', score: 76, status: 'Idle', joined: '10 Mar 2026' },
        { name: 'Rahul Mehta', email: 'rahul@safeguard.in', score: 61, status: 'Simulating', joined: '08 Mar 2026' },
        { name: 'Sneha Iyer', email: 'sneha@safeguard.in', score: 95, status: 'Idle', joined: '05 Mar 2026' },
        { name: 'Vikram Singh', email: 'vikram@safeguard.in', score: 42, status: 'Idle', joined: '01 Mar 2026' },
    ];

    renderStudentList(students);
    renderActivityLog();
    renderBadges();
}

function renderStudentList(students) {
    const body = document.querySelector('#allStudentsTable tbody');
    body.innerHTML = '';

    students.forEach(s => {
        const tr = document.createElement('tr');
        const initials = s.name.split(' ').map(n => n[0]).join('');
        const statusClass = s.status === 'Idle' ? 'status-inactive' : 'vr-live';

        tr.innerHTML = `
            <td class="profile-cell">
                <div class="s-avatar">${initials}</div>
                <div class="s-info">
                    <p class="s-name" style="font-weight:600">${s.name}</p>
                    <p class="s-email" style="font-size:0.75rem; color:var(--text-muted)">${s.email}</p>
                </div>
            </td>
            <td><span class="score-badge">${s.score}%</span></td>
            <td><span class="${statusClass}">${s.status}</span></td>
            <td>
                <div class="action-btns">
                    <button class="btn-sm" title="Monitoring">📊</button>
                    <button class="btn-sm" title="Edit">✏️</button>
                    <button class="btn-sm" title="Deactivate">🚫</button>
                </div>
            </td>
        `;
        body.appendChild(tr);
    });
}

function renderActivityLog() {
    const log = document.getElementById('studentActivityLog');
    const activities = [
        { icon: '🎮', text: 'Arjun Sharma started <strong>Earthquake Drill</strong>', time: '2 mins ago', color: '#e0e7ff' },
        { icon: '🤖', text: 'Priya Patel used <strong>AI Chatbot</strong> for Flood Prep', time: '15 mins ago', color: '#f3e8ff' },
        { icon: '🏅', text: 'Sneha Iyer earned <strong>Fire Hero</strong> badge', time: '1 hour ago', color: '#fef3c7' },
        { icon: '🚪', text: 'Rahul Mehta logged into the <strong>Student Dashboard</strong>', time: '3 hours ago', color: '#dcfce7' },
    ];

    log.innerHTML = activities.map(a => `
        <div class="log-item">
            <div class="log-icon" style="background:${a.color}">${a.icon}</div>
            <div class="log-text">
                <p>${a.text}</p>
                <p class="time">${a.time}</p>
            </div>
        </div>
    `).join('');
}

function renderBadges() {
    const grid = document.getElementById('badgeTracking');
    const badges = [
        { icon: '🛡️', label: 'Safety Pro', earned: true },
        { icon: '🔥', label: 'Fire Hero', earned: true },
        { icon: '🌊', label: 'Flood Ready', earned: false },
        { icon: '🌍', label: 'Quake Master', earned: true },
        { icon: '🩺', label: 'First Aid', earned: false },
        { icon: '🔭', label: 'Radar Expert', earned: true },
        { icon: '🤖', text: 'AI Whiz', earned: false },
        { icon: '🏃', label: 'Quick Exit', earned: true },
    ];

    grid.innerHTML = badges.map(b => `
        <div class="badge-item ${b.earned ? 'earned' : ''}">
            <span>${b.icon}</span>
            <small>${b.label || b.text}</small>
        </div>
    `).join('');
}

function setupStudentSearch() {
    const search = document.getElementById('studentSearch');
    if (search) {
        search.addEventListener('input', (e) => {
            const val = e.target.value.toLowerCase();
            const rows = document.querySelectorAll('#allStudentsTable tbody tr');
            rows.forEach(row => {
                const text = row.innerText.toLowerCase();
                row.style.display = text.includes(val) ? '' : 'none';
            });
        });
    }
}

/**
 * LIVE DRILL MONITORING ENGINE
 */
let adminLiveInterval = null;
let isFeedActive = true;

function toggleLiveDrill() {
    isFeedActive = !isFeedActive;
    const btn = document.querySelector('.btn-console');
    if (btn) btn.textContent = isFeedActive ? 'Pause Feed' : 'Resume Feed';
}

function triggerInstitutionalDrill() {
    alert('🚨 ATTENTION: System-wide drill deployment sequence initiated. All VR zones activating in 5s.');

    // Start active monitoring
    if (adminLiveInterval) clearInterval(adminLiveInterval);

    adminLiveInterval = setInterval(() => {
        if (!isFeedActive) return;

        // Earthquake Data
        const mag = (Math.random() * 8).toFixed(1);
        const adminMagEl = document.getElementById('adminEqMag');
        if (adminMagEl) adminMagEl.textContent = `${mag} M`;

        document.querySelectorAll('#adminEqGraph .bar').forEach(bar => {
            bar.style.setProperty('--h', `${Math.random() * 100}%`);
        });

        // Fire Data
        const temp = Math.floor(24 + Math.random() * 90);
        const adminFireEl = document.getElementById('adminFireHazard');
        const adminFireStatus = document.getElementById('adminFireStatus');

        if (adminFireEl) adminFireEl.textContent = `${temp}°C`;
        if (adminFireStatus) {
            if (temp > 70) {
                adminFireStatus.textContent = 'CRITICAL SPIKE';
                adminFireStatus.style.color = '#ef4444';
            } else {
                adminFireStatus.textContent = 'Stable Monitoring';
                adminFireStatus.style.color = 'var(--success)';
            }
        }

        // Participants
        const pCount = Math.floor(20 + Math.random() * 50);
        const pEl = document.getElementById('adminEqParticipants');
        if (pEl) pEl.textContent = pCount;

    }, 2000);
}

// Initial trigger for preview
setTimeout(triggerInstitutionalDrill, 1000);

function logout() {
    localStorage.removeItem('safeguard_token');
    localStorage.removeItem('safeguard_refresh');
    localStorage.removeItem('safeguard_user');
    window.location.href = 'login.html';
}
