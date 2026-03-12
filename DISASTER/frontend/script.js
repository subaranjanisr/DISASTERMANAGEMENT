// ===================================
// SAFEGUARD - Interactive JavaScript
// ===================================

// === Navbar Scroll Effect ===
const navbar = document.getElementById('navbar');
let lastScroll = 0;

window.addEventListener('scroll', () => {
    const currentScroll = window.pageYOffset;

    if (currentScroll > 100) {
        navbar.classList.add('scrolled');
    } else {
        navbar.classList.remove('scrolled');
    }

    lastScroll = currentScroll;
});

// === Mobile Menu Toggle ===
const hamburger = document.getElementById('hamburger');
const navMenu = document.getElementById('navMenu');

hamburger.addEventListener('click', () => {
    navMenu.classList.toggle('active');
    hamburger.classList.toggle('active');
});

// Close menu when clicking on a link
document.querySelectorAll('.nav-link').forEach(link => {
    link.addEventListener('click', () => {
        navMenu.classList.remove('active');
        hamburger.classList.remove('active');
    });
});

// === Smooth Scroll to Section ===
function scrollToSection(sectionId) {
    const section = document.getElementById(sectionId);
    if (section) {
        const offsetTop = section.offsetTop - 80; // Account for navbar height
        window.scrollTo({
            top: offsetTop,
            behavior: 'smooth'
        });
    }
}

// Add smooth scroll to all nav links
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        e.preventDefault();
        const targetId = this.getAttribute('href').substring(1);
        scrollToSection(targetId);
    });
});

// === Impact Tabs Functionality ===
function switchTab(tabName) {
    // Hide all tab contents
    document.querySelectorAll('.impact-tab-content').forEach(content => {
        content.classList.remove('active');
    });

    // Remove active class from all buttons
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.classList.remove('active');
    });

    // Show selected tab content
    const selectedContent = document.getElementById(`${tabName}-impact`);
    if (selectedContent) {
        selectedContent.classList.add('active');
    }

    // Add active class to clicked button
    event.target.classList.add('active');
}

// === Scroll Animations ===
const observerOptions = {
    threshold: 0.1,
    rootMargin: '0px 0px -100px 0px'
};

const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.style.opacity = '1';
            entry.target.style.transform = 'translateY(0)';
        }
    });
}, observerOptions);

// Observe all cards and sections for animation
document.addEventListener('DOMContentLoaded', () => {
    const animatedElements = document.querySelectorAll(`
        .problem-card,
        .feature-card,
        .impact-card,
        .tech-item,
        .ai-card,
        .timeline-item,
        .pricing-card,
        .cta-option
    `);

    animatedElements.forEach(el => {
        el.style.opacity = '0';
        el.style.transform = 'translateY(30px)';
        el.style.transition = 'opacity 0.6s ease-out, transform 0.6s ease-out';
        observer.observe(el);
    });
});

// === Counter Animation for Stats ===
function animateCounter(element, target, duration = 2000) {
    const start = 0;
    const increment = target / (duration / 16); // 60fps
    let current = start;

    const timer = setInterval(() => {
        current += increment;
        if (current >= target) {
            element.textContent = formatNumber(target);
            clearInterval(timer);
        } else {
            element.textContent = formatNumber(Math.floor(current));
        }
    }, 16);
}

function formatNumber(num) {
    if (num >= 1000000) {
        return (num / 1000000).toFixed(1) + 'M';
    } else if (num >= 1000) {
        return (num / 1000).toFixed(1) + 'K';
    }
    return num.toString();
}

// Animate hero stats when they come into view
const heroStatsObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            const statNumbers = entry.target.querySelectorAll('.stat-number');
            statNumbers.forEach(stat => {
                const text = stat.textContent;
                const num = parseInt(text.replace(/[^0-9]/g, ''));
                if (!isNaN(num)) {
                    stat.textContent = '0';
                    setTimeout(() => {
                        animateCounter(stat, num);
                    }, 300);
                }
            });
            heroStatsObserver.unobserve(entry.target);
        }
    });
}, { threshold: 0.5 });

const heroStats = document.querySelector('.hero-stats');
if (heroStats) {
    heroStatsObserver.observe(heroStats);
}

// === Floating Cards Animation ===
document.querySelectorAll('.floating-card').forEach((card, index) => {
    card.style.animationDelay = `${index * 0.2}s`;
});

// === Gradient Orbs Mouse Follow Effect ===
document.addEventListener('mousemove', (e) => {
    const orbs = document.querySelectorAll('.gradient-orb');
    const x = e.clientX / window.innerWidth;
    const y = e.clientY / window.innerHeight;

    orbs.forEach((orb, index) => {
        const speed = (index + 1) * 20;
        const xMove = (x - 0.5) * speed;
        const yMove = (y - 0.5) * speed;

        orb.style.transform = `translate(${xMove}px, ${yMove}px)`;
    });
});

// === Button Ripple Effect ===
document.querySelectorAll('.btn').forEach(button => {
    button.addEventListener('click', function (e) {
        const ripple = document.createElement('span');
        const rect = this.getBoundingClientRect();
        const size = Math.max(rect.width, rect.height);
        const x = e.clientX - rect.left - size / 2;
        const y = e.clientY - rect.top - size / 2;

        ripple.style.width = ripple.style.height = size + 'px';
        ripple.style.left = x + 'px';
        ripple.style.top = y + 'px';
        ripple.classList.add('ripple');

        this.appendChild(ripple);

        setTimeout(() => {
            ripple.remove();
        }, 600);
    });
});

// === Parallax Effect for Sections ===
window.addEventListener('scroll', () => {
    const scrolled = window.pageYOffset;

    // Parallax for hero section
    const heroContent = document.querySelector('.hero-content');
    if (heroContent) {
        heroContent.style.transform = `translateY(${scrolled * 0.3}px)`;
    }

    // Parallax for floating cards
    document.querySelectorAll('.floating-card').forEach((card, index) => {
        const speed = 0.1 + (index * 0.05);
        card.style.transform = `translateY(${scrolled * speed}px)`;
    });
});

// === Active Nav Link on Scroll ===
const sections = document.querySelectorAll('section[id]');

window.addEventListener('scroll', () => {
    const scrollY = window.pageYOffset;

    sections.forEach(section => {
        const sectionHeight = section.offsetHeight;
        const sectionTop = section.offsetTop - 100;
        const sectionId = section.getAttribute('id');

        if (scrollY > sectionTop && scrollY <= sectionTop + sectionHeight) {
            document.querySelectorAll('.nav-link').forEach(link => {
                link.classList.remove('active');
                if (link.getAttribute('href') === `#${sectionId}`) {
                    link.classList.add('active');
                }
            });
        }
    });
});

// === Typing Effect for Hero Title (Optional Enhancement) ===
function typeWriter(element, text, speed = 100) {
    let i = 0;
    element.textContent = '';

    function type() {
        if (i < text.length) {
            element.textContent += text.charAt(i);
            i++;
            setTimeout(type, speed);
        }
    }

    type();
}

// === Load Animation ===
window.addEventListener('load', () => {
    document.body.classList.add('loaded');

    // Add stagger animation to hero elements
    const heroElements = document.querySelectorAll('.hero-badge, .hero-title, .hero-subtitle, .hero-stats, .hero-cta');
    heroElements.forEach((el, index) => {
        setTimeout(() => {
            el.style.opacity = '1';
            el.style.transform = 'translateY(0)';
        }, index * 150);
    });
});

// === Scroll Progress Indicator ===
function updateScrollProgress() {
    const winScroll = document.body.scrollTop || document.documentElement.scrollTop;
    const height = document.documentElement.scrollHeight - document.documentElement.clientHeight;
    const scrolled = (winScroll / height) * 100;

    // You can add a progress bar element if needed
    // document.getElementById('progressBar').style.width = scrolled + '%';
}

window.addEventListener('scroll', updateScrollProgress);

// === Form Validation (if forms are added) ===
function validateEmail(email) {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
}

// === Modal Functionality (for demo videos, etc.) ===
function openModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.style.display = 'flex';
        document.body.style.overflow = 'hidden';
    }
}

function closeModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.style.display = 'none';
        document.body.style.overflow = 'auto';
    }
}

// Close modal on outside click
window.addEventListener('click', (e) => {
    if (e.target.classList.contains('modal')) {
        e.target.style.display = 'none';
        document.body.style.overflow = 'auto';
    }
});

// === Performance Optimization ===
// Debounce function for scroll events
function debounce(func, wait = 10) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// Apply debounce to scroll handlers
const debouncedScroll = debounce(() => {
    updateScrollProgress();
}, 10);

window.addEventListener('scroll', debouncedScroll);

// === Accessibility Enhancements ===
// Keyboard navigation for tabs
document.querySelectorAll('.tab-btn').forEach((btn, index, buttons) => {
    btn.addEventListener('keydown', (e) => {
        if (e.key === 'ArrowRight') {
            e.preventDefault();
            const nextBtn = buttons[(index + 1) % buttons.length];
            nextBtn.focus();
            nextBtn.click();
        } else if (e.key === 'ArrowLeft') {
            e.preventDefault();
            const prevBtn = buttons[(index - 1 + buttons.length) % buttons.length];
            prevBtn.focus();
            prevBtn.click();
        }
    });
});

// === Easter Egg: Konami Code ===
let konamiCode = [];
const konamiSequence = ['ArrowUp', 'ArrowUp', 'ArrowDown', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'ArrowLeft', 'ArrowRight', 'b', 'a'];

document.addEventListener('keydown', (e) => {
    konamiCode.push(e.key);
    konamiCode = konamiCode.slice(-10);

    if (konamiCode.join('') === konamiSequence.join('')) {
        activateEasterEgg();
    }
});

function activateEasterEgg() {
    // Add fun animation or message
    document.body.style.animation = 'rainbow 2s infinite';
    setTimeout(() => {
        document.body.style.animation = '';
        alert('🎉 You found the secret! SAFEGUARD saves lives! 🛡️');
    }, 2000);
}

// === Print Styles Trigger ===
window.addEventListener('beforeprint', () => {
    console.log('Preparing to print...');
    // Add any print-specific modifications
});

// === Service Worker Registration (for PWA) ===
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        // Uncomment when service worker is ready
        // navigator.serviceWorker.register('/sw.js')
        //     .then(reg => console.log('Service Worker registered'))
        //     .catch(err => console.log('Service Worker registration failed'));
    });
}

// === Analytics Tracking (Placeholder) ===
function trackEvent(category, action, label) {
    // Integrate with Google Analytics or other analytics service
    console.log(`Event tracked: ${category} - ${action} - ${label}`);

    // Example: gtag('event', action, { 'event_category': category, 'event_label': label });
}

// Track button clicks
document.querySelectorAll('.btn').forEach(btn => {
    btn.addEventListener('click', () => {
        trackEvent('Button', 'Click', btn.textContent.trim());
    });
});

// === Dynamic Year in Footer ===
const currentYear = new Date().getFullYear();
const copyrightElement = document.querySelector('.footer-copyright');
if (copyrightElement) {
    copyrightElement.textContent = `© ${currentYear} SAFEGUARD. All rights reserved.`;
}

// === Lazy Loading for Images (when added) ===
if ('IntersectionObserver' in window) {
    const imageObserver = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const img = entry.target;
                img.src = img.dataset.src;
                img.classList.remove('lazy');
                imageObserver.unobserve(img);
            }
        });
    });

    document.querySelectorAll('img.lazy').forEach(img => {
        imageObserver.observe(img);
    });
}

// === Console Message ===
console.log(`
%c🛡️ SAFEGUARD - Disaster Preparedness Platform
%cTransforming lives through technology.
%cInterested in joining our mission? Contact us at hello@safeguard.edu
`,
    'color: #667eea; font-size: 20px; font-weight: bold;',
    'color: #b4b8d0; font-size: 14px;',
    'color: #8b90a8; font-size: 12px;'
);

// === Initialize Everything on DOM Load ===
document.addEventListener('DOMContentLoaded', () => {
    console.log('SAFEGUARD platform initialized');

    // Add any initialization code here
    updateScrollProgress();

    // Preload critical resources
    const criticalImages = [
        // Add paths to critical images when available
    ];

    criticalImages.forEach(src => {
        const img = new Image();
        img.src = src;
    });
});

// === Export functions for external use ===
window.SAFEGUARD = {
    scrollToSection,
    switchTab,
    openModal,
    closeModal,
    trackEvent
};
