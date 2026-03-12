/**
 * SAFEGUARD - Signup Logic
 * Handles multi-step form navigation, validation, and real API calls
 */

// API base URL; dynamically derive from current origin when possible
// This helps avoid CORS errors when the frontend is served from the same
// host as the backend (e.g. behind a proxy or when using Express static). 
const API_BASE = (() => {
    const origin = window.location.origin;
    if (origin && origin !== 'null' && origin !== 'file://') {
        return `${origin}/api/v1`;
    }
    return 'http://localhost:5000/api/v1';
})();

// State
let currentStep = 1;
let selectedRole = null;

// DOM Elements
const formSteps = [
    document.getElementById('formStep1'),
    document.getElementById('formStep2'),
    document.getElementById('formStep3'),
    document.getElementById('successStep')
];

const stepDots = [
    document.getElementById('step-dot-1'),
    document.getElementById('step-dot-2'),
    document.getElementById('step-dot-3')
];

// -------------------------------------------------------------------------
// Navigation
// -------------------------------------------------------------------------

function goToStep(stepNumber) {
    if (stepNumber === 2 && !selectedRole) {
        showToast('Please select a role first');
        return;
    }

    if (stepNumber === 3) {
        if (!validateStep2()) return;
        updateReviewCard();
    }

    // Update current step
    currentStep = stepNumber;

    // Toggle forms
    formSteps.forEach((step, idx) => {
        if (idx === stepNumber - 1) {
            step.classList.add('active');
        } else {
            step.classList.remove('active');
        }
    });

    // Update progress dots
    stepDots.forEach((dot, idx) => {
        if (idx + 1 === stepNumber) {
            dot.classList.add('active');
            dot.classList.remove('completed');
        } else if (idx + 1 < stepNumber) {
            dot.classList.remove('active');
            dot.classList.add('completed');
        } else {
            dot.classList.remove('active', 'completed');
        }
    });

    // Update step lines
    const lines = document.querySelectorAll('.step-line');
    lines.forEach((line, idx) => {
        if (idx + 1 < stepNumber) {
            line.classList.add('completed');
        } else {
            line.classList.remove('completed');
        }
    });

    window.scrollTo(0, 0);
}

// -------------------------------------------------------------------------
// Role Selection
// -------------------------------------------------------------------------

function selectRole(role) {
    selectedRole = role;

    // Visual feedback
    document.getElementById('roleStudent').classList.toggle('selected', role === 'student');
    document.getElementById('roleAdmin').classList.toggle('selected', role === 'admin');

    // Enable next button
    document.getElementById('step1Next').disabled = false;

    // Toggle specific fields
    document.getElementById('studentFields').style.display = role === 'student' ? 'block' : 'none';
    document.getElementById('adminFields').style.display = role === 'admin' ? 'block' : 'none';

    // Clear admin code if switching to student
    if (role === 'student') {
        document.getElementById('adminCode').value = '';
    }
}

// -------------------------------------------------------------------------
// Validation & Form Logic
// -------------------------------------------------------------------------

function togglePassword(id) {
    const input = document.getElementById(id);
    input.type = input.type === 'password' ? 'text' : 'password';
}

function validateStep2() {
    let isValid = true;
    const fields = ['firstName', 'lastName', 'email', 'institution'];

    // Basic required fields
    fields.forEach(f => {
        const input = document.getElementById(f);
        const err = document.getElementById(f + 'Err');
        if (!input.value.trim()) {
            err.textContent = 'This field is required';
            isValid = false;
        } else {
            err.textContent = '';
        }
    });

    // Email format
    const email = document.getElementById('email').value;
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        document.getElementById('emailErr').textContent = 'Invalid email format';
        isValid = false;
    }

    // Admin code
    if (selectedRole === 'admin') {
        const code = document.getElementById('adminCode').value;
        if (!code) {
            document.getElementById('adminCodeErr').textContent = 'Admin code is required';
            isValid = false;
        }
    }

    return isValid;
}

function checkPasswordStrength(p) {
    const rules = {
        length: p.length >= 8,
        upper: /[A-Z]/.test(p),
        lower: /[a-z]/.test(p),
        number: /[0-9]/.test(p)
    };

    let score = 0;
    Object.keys(rules).forEach(r => {
        const el = document.getElementById('rule-' + r);
        if (rules[r]) {
            el.classList.add('pass');
            el.textContent = '✓ ' + el.textContent.substring(2);
            score++;
        } else {
            el.classList.remove('pass');
            el.textContent = '✗ ' + el.textContent.substring(2);
        }
    });

    const fill = document.getElementById('strengthFill');
    const label = document.getElementById('strengthLabel');
    const colors = ['#ef4444', '#f59e0b', '#f59e0b', '#10b981', '#10b981'];
    const labels = ['Too weak', 'Weak', 'Fair', 'Strong', 'Excellent'];

    fill.style.width = (score / 4) * 100 + '%';
    fill.style.background = colors[score];
    label.textContent = labels[score];
    label.style.color = colors[score];
}

function checkConfirmPassword() {
    const p1 = document.getElementById('password').value;
    const p2 = document.getElementById('confirmPassword').value;
    const err = document.getElementById('confirmPasswordErr');

    if (p2 && p1 !== p2) {
        err.textContent = 'Passwords do not match';
    } else {
        err.textContent = '';
    }
}

function updateReviewCard() {
    document.getElementById('reviewRole').textContent = selectedRole.charAt(0).toUpperCase() + selectedRole.slice(1);
    document.getElementById('reviewName').textContent = document.getElementById('firstName').value + ' ' + document.getElementById('lastName').value;
    document.getElementById('reviewEmail').textContent = document.getElementById('email').value;
    document.getElementById('reviewInstitution').textContent = document.getElementById('institution').value || 'N/A';
}

// -------------------------------------------------------------------------
// API Call
// -------------------------------------------------------------------------

// simple server health probe
async function checkServer() {
    try {
        const resp = await fetch(`${API_BASE}/health`);
        return resp.ok;
    } catch (e) {
        return false;
    }
}

async function handleSignup() {
    // ensure backend is reachable before running through validation
    if (!(await checkServer())) {
        showToast('Cannot reach backend API. Is the server running at ' + API_BASE + '?');
        return;
    }
    // Validation
    const p1 = document.getElementById('password').value;
    const p2 = document.getElementById('confirmPassword').value;
    const terms = document.getElementById('agreeTerms').checked;

    if (p1 !== p2) {
        showToast('Passwords must match');
        return;
    }

    if (!terms) {
        showToast('You must agree to the terms');
        return;
    }

    const signupBtn = document.getElementById('signupBtn');
    signupBtn.disabled = true;
    signupBtn.innerHTML = '<span>Processing...</span>';

    // Build payload
    const payload = {
        firstName: document.getElementById('firstName').value,
        lastName: document.getElementById('lastName').value,
        email: document.getElementById('email').value,
        password: p1,
        role: selectedRole,
        institution: document.getElementById('institution').value,
        course: document.getElementById('course').value,
        grade: document.getElementById('grade').value,
        phone: document.getElementById('phone').value,
        department: document.getElementById('department').value,
        adminCode: document.getElementById('adminCode').value
    };

    try {
        const response = await fetch(`${API_BASE}/auth/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        const data = await response.json();

        if (response.ok) {
            showSuccess(data);
        } else {
            showToast(data.message || 'Registration failed');
        }
    } catch (err) {
        showToast('Server error: ' + (err.message || 'Cannot connect to backend. Ensure it is running on port 5000.'));
    } finally {
        signupBtn.disabled = false;
        signupBtn.innerHTML = '<span>Create Account</span><span>🛡️</span>';
    }
}

function showSuccess(data) {
    const user = data.user;
    if (selectedRole === 'student' && user.studentId) {
        document.getElementById('studentIdBox').style.display = 'block';
        document.getElementById('studentIdDisplay').textContent = user.studentId;
        document.getElementById('successDesc').textContent = 'Welcome, ' + user.firstName + '! Your student profile has been created.';
    } else {
        document.getElementById('studentIdBox').style.display = 'none';
        document.getElementById('successDesc').textContent = 'Admin account created successfully. Please log in to continue.';
    }

    goToStep(4);
}

// -------------------------------------------------------------------------
// Helpers
// -------------------------------------------------------------------------

function showToast(msg) {
    const toast = document.getElementById('errorToast');
    document.getElementById('toastMsg').textContent = msg;
    toast.classList.add('show');
    setTimeout(() => toast.classList.remove('show'), 5000);
}

function closeToast() {
    document.getElementById('errorToast').classList.remove('show');
}

// Init
document.addEventListener('DOMContentLoaded', () => {
    console.log('SAFEGUARD Signup Initialized');
});
