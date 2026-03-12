/**
 * SAFEGUARD - Admin Dashboard Logic
 * Connects to real backend API to manage institution analytics
 */

const API_BASE = 'http://localhost:5000/api/v1';

document.addEventListener('DOMContentLoaded', () => {
    checkAdminAuth();
    loadAdminData();

    // Set current date
    const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    document.getElementById('currentDate').textContent = new Date().toLocaleDateString('en-US', options);
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

async function loadAdminData() {
    const token = localStorage.getItem('safeguard_token');

    try {
        const response = await fetch(`${API_BASE}/admin/dashboard`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        const data = await response.json();

        if (response.ok && data.success) {
            updateDashboardUI(data.analytics);
        } else {
            console.error('Failed to load dashboard data:', data.message);
        }
    } catch (err) {
        console.error('Network error loading admin data:', err);
    }
}

function updateDashboardUI(analytics) {
    // Basic stats
    document.getElementById('statTotalStudents').textContent = analytics.totalStudents || 0;
    document.getElementById('statActiveStudents').textContent = analytics.activeStudentsThisWeek || 0;
    document.getElementById('statAvgScore').textContent = (analytics.avgPreparednessScore || 0) + '%';

    // Sum up drills
    const totalDrills = Object.values(analytics.drills || {}).reduce((a, b) => a + b, 0);
    document.getElementById('statDrillsCompleted').textContent = totalDrills;

    // Recent Students Table
    const tableBody = document.querySelector('#recentStudentsTable tbody');
    tableBody.innerHTML = '';

    if (analytics.recentRegistrations && analytics.recentRegistrations.length > 0) {
        analytics.recentRegistrations.forEach(student => {
            const row = document.createElement('tr');
            const joinedDate = new Date(student.createdAt).toLocaleDateString();

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
                <td>${joinedDate}</td>
            `;
            tableBody.appendChild(row);
        });
    } else {
        tableBody.innerHTML = '<tr><td colspan="5" style="text-align:center; padding: 40px;">No recent students found.</td></tr>';
    }
}

function logout() {
    localStorage.removeItem('safeguard_token');
    localStorage.removeItem('safeguard_refresh');
    localStorage.removeItem('safeguard_user');
    window.location.href = 'login.html';
}
