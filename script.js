// ==================== UTILITY FUNCTIONS ====================

// localStorage data management
function getDonors() {
    return JSON.parse(localStorage.getItem('chavali_donors') || '[]');
}

function saveDonors(donors) {
    localStorage.setItem('chavali_donors', JSON.stringify(donors));
}

function normalizePhone(phone) {
    let digits = String(phone || '').replace(/\D/g, '');
    // Bangladesh common formats:
    // - 01XXXXXXXXX (local)
    // - 1XXXXXXXXX (missing leading 0)
    // - +8801XXXXXXXXX / 8801XXXXXXXXX (international)
    // - +88017XXXXXXXX / 88017XXXXXXXX (international without leading 0)
    if (digits.startsWith('880') && digits.length >= 13) {
        // convert 8801xxxxxxxxx or 88017xxxxxxxx -> 01xxxxxxxxx
        digits = '0' + digits.slice(3);
    }
    if (digits.startsWith('1') && digits.length === 10) {
        digits = '0' + digits;
    }
    return digits;
}

function upsertDonorFromDonation({ donorName, donorPhone, donorAddress, bloodGroup, donationDate }) {
    const phoneKey = normalizePhone(donorPhone);
    if (!phoneKey) return;

    const donors = getDonors();
    const existingIndex = donors.findIndex(d => normalizePhone(d.mobile) === phoneKey);

    if (existingIndex !== -1) {
        donors[existingIndex] = {
            ...donors[existingIndex],
            name: donorName || donors[existingIndex].name,
            address: donorAddress || donors[existingIndex].address,
            bloodGroup: bloodGroup || donors[existingIndex].bloodGroup,
            lastDonation: donationDate || donors[existingIndex].lastDonation,
            mobile: donors[existingIndex].mobile || donorPhone
        };
    } else {
        donors.push({
            id: Date.now(),
            name: donorName,
            mobile: donorPhone,
            bloodGroup: bloodGroup,
            address: donorAddress,
            lastDonation: donationDate,
            registeredAt: new Date().toISOString()
        });
    }

    saveDonors(donors);
}

function getGalleryImages() {
    return JSON.parse(localStorage.getItem('chavali_gallery') || '[]');
}

function saveGalleryImages(images) {
    localStorage.setItem('chavali_gallery', JSON.stringify(images));
}

function getDonorPhotos() {
    return JSON.parse(localStorage.getItem('chavali_donor_photos') || '[]');
}

function saveDonorPhotos(photos) {
    localStorage.setItem('chavali_donor_photos', JSON.stringify(photos));
}

function getDonations() {
    return JSON.parse(localStorage.getItem('chavali_donations') || '[]');
}

function saveDonations(donations) {
    localStorage.setItem('chavali_donations', JSON.stringify(donations));
}

// Bengali digit conversion
function toBengali(num) {
    const bengaliDigits = ['০','১','২','৩','৪','৫','৬','৭','৮','৯'];
    return String(num).replace(/[0-9]/g, d => bengaliDigits[d]);
}

// ==================== HEADER & NAVIGATION ====================
const header = document.getElementById('header');
const hamburger = document.getElementById('hamburger');
const mainNav = document.getElementById('mainNav');
const mobileOverlay = document.getElementById('mobileOverlay');
const scrollTopBtn = document.getElementById('scrollTopBtn');

// Change header style while scrolling
window.addEventListener('scroll', debounce(() => {
    // Header shadow
    if (window.scrollY > 50) {
        if (header) header.classList.add('scrolled');
        if (scrollTopBtn) scrollTopBtn.classList.add('visible');
    } else {
        if (header) header.classList.remove('scrolled');
        if (scrollTopBtn) scrollTopBtn.classList.remove('visible');
    }
}, 100));

// Mobile menu toggle
if (hamburger) {
    hamburger.addEventListener('click', () => {
        hamburger.classList.toggle('active');
        if (mainNav) mainNav.classList.toggle('open');
        if (mobileOverlay) mobileOverlay.classList.toggle('active');
    });
}

if (mobileOverlay) {
    mobileOverlay.addEventListener('click', closeMenu);
}

function closeMenu() {
    if (hamburger) hamburger.classList.remove('active');
    if (mainNav) mainNav.classList.remove('open');
    if (mobileOverlay) mobileOverlay.classList.remove('active');
}

// Close menu on nav link click
document.querySelectorAll('.nav a').forEach(link => {
    link.addEventListener('click', closeMenu);
});

// Scroll to top
if (scrollTopBtn) {
    scrollTopBtn.addEventListener('click', () => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
    });
}

// Debounce function
function debounce(func, delay) {
    let timeoutId;
    return function(...args) {
        clearTimeout(timeoutId);
        timeoutId = setTimeout(() => func(...args), delay);
    };
}

// ==================== DONOR FORM SUBMISSION ====================
const donorForm = document.getElementById('donorForm');
const successMsg = document.getElementById('successMsg');

if (donorForm) {
    donorForm.addEventListener('submit', (e) => {
        e.preventDefault();

        const donor = {
            id: Date.now(),
            name: document.getElementById('name').value.trim(),
            mobile: document.getElementById('mobile').value.trim(),
            bloodGroup: document.getElementById('bloodGroup').value,
            address: document.getElementById('address').value.trim(),
            lastDonation: document.getElementById('lastDonation').value,
            registeredAt: new Date().toISOString()
        };

        const donors = getDonors();
        donors.push(donor);
        saveDonors(donors);

        // Show success message
        successMsg.classList.add('show');
        donorForm.reset();

        // Update
        renderDonorList();
        updateStats();

        // Hide after 5 seconds
        setTimeout(() => {
            successMsg.classList.remove('show');
        }, 5000);
    });
}

// ==================== DONOR LIST RENDERING ====================
const donorGrid = document.getElementById('donorGrid');
const donorFilters = document.getElementById('donorFilters');
let currentFilter = 'all';

function getDonorProfileImage(donor) {
    if (!donor.mobile) return null;
    
    const donations = getDonations();
    const phoneKey = normalizePhone(donor.mobile);
    
    // Find all donations by this donor (matched by phone)
    const donorDonations = donations
        .filter(d => normalizePhone(d.donorPhone) === phoneKey && d.image)
        .sort((a, b) => new Date(b.addedAt) - new Date(a.addedAt)); // Most recent first
    
    return donorDonations.length > 0 ? donorDonations[0].image : null;
}

function renderDonorList(filter = 'all') {
    if (!donorGrid) return; // Exit if donorGrid doesn't exist on this page
    
    const donors = getDonors();
    let filtered = filter === 'all' ? donors : donors.filter(d => d.bloodGroup === filter);
    
    // Sort by last donation date (most recent first)
    filtered = filtered.sort((a, b) => {
        const dateA = a.lastDonation ? new Date(a.lastDonation) : new Date(0);
        const dateB = b.lastDonation ? new Date(b.lastDonation) : new Date(0);
        return dateB - dateA; // Most recent first
    });

    if (filtered.length === 0) {
        donorGrid.innerHTML = `
            <div class="no-donors" style="grid-column:1/-1;">
                <div class="icon"></div>
                <p>${filter === 'all' ? 'No donors registered yet' : 'No donors found for ' + filter + ' blood group'}</p>
            </div>
        `;
        return;
    }

    donorGrid.innerHTML = filtered.map(donor => {
        const profileImage = getDonorProfileImage(donor);
        
        return `
        <div class="donor-card">
            <div class="donor-card-header">
                <div class="donor-avatar">
                    ${profileImage ? 
                        `<img src="${profileImage}" alt="${donor.name}" style="width:100%; height:100%; object-fit:cover; border-radius:50%;">` : 
                        ''
                    }
                </div>
                <div>
                    <div class="donor-name">${donor.name}</div>
                    <span class="donor-blood">${donor.bloodGroup}</span>
                </div>
            </div>
            <div class="donor-info">
                <div class="donor-info-item">
                    <span class="icon">📍</span>
                    <span>${donor.address}</span>
                </div>
                <div class="donor-info-item">
                    <span class="icon">📞</span>
                    <span>${donor.mobile}</span>
                </div>
                ${donor.lastDonation ? `
                <div class="donor-info-item">
                    <span class="icon">🩸</span>
                    <span>Last Donation: ${donor.lastDonation}</span>
                </div>
                ` : ''}
            </div>
        </div>
    `;}).join('');
}

// Filter buttons
if (donorFilters) {
    donorFilters.addEventListener('click', (e) => {
        if (e.target.classList.contains('filter-btn')) {
            document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
            e.target.classList.add('active');
            currentFilter = e.target.dataset.filter;
            renderDonorList(currentFilter);
        }
    });
}

// ==================== DONATION SLIDER ====================
let currentSlide = 0;
let donationSlides = [];
let donationSliderIntervalId = null;
let lastSliderPresetIndex = -1;

const sliderTransitionPresets = [
    // Smooth default
    {
        sliderDuration: '0.9s',
        sliderEase: 'cubic-bezier(0.22, 1, 0.36, 1)',
        activeZoom: '1.04',
        activeFilter: 'none',
        activeDuration: '1.2s',
        activeEase: 'cubic-bezier(0.22, 1, 0.36, 1)',
        contentOffset: '10px',
        contentDuration: '0.9s',
        contentEase: 'ease'
    },
    // Snappy slide
    {
        sliderDuration: '0.55s',
        sliderEase: 'cubic-bezier(0.34, 1.56, 0.64, 1)',
        activeZoom: '1.02',
        activeFilter: 'none',
        activeDuration: '0.7s',
        activeEase: 'cubic-bezier(0.34, 1.56, 0.64, 1)',
        contentOffset: '14px',
        contentDuration: '0.6s',
        contentEase: 'cubic-bezier(0.34, 1.56, 0.64, 1)'
    },
    // Cinematic slow
    {
        sliderDuration: '1.2s',
        sliderEase: 'cubic-bezier(0.16, 1, 0.3, 1)',
        activeZoom: '1.06',
        activeFilter: 'contrast(1.05) saturate(1.05)',
        activeDuration: '1.6s',
        activeEase: 'cubic-bezier(0.16, 1, 0.3, 1)',
        contentOffset: '8px',
        contentDuration: '1.1s',
        contentEase: 'cubic-bezier(0.16, 1, 0.3, 1)'
    },
    // Gentle fade feel
    {
        sliderDuration: '0.85s',
        sliderEase: 'ease-in-out',
        activeZoom: '1.03',
        activeFilter: 'brightness(1.03) saturate(1.06)',
        activeDuration: '1.0s',
        activeEase: 'ease-in-out',
        contentOffset: '16px',
        contentDuration: '0.8s',
        contentEase: 'ease-in-out'
    }
];

function applySliderTransitionPreset() {
    const sliderTrack = document.getElementById('donationSlider');
    if (!sliderTrack) return;

    if (sliderTransitionPresets.length === 0) return;

    let idx = Math.floor(Math.random() * sliderTransitionPresets.length);
    if (sliderTransitionPresets.length > 1 && idx === lastSliderPresetIndex) {
        idx = (idx + 1) % sliderTransitionPresets.length;
    }
    lastSliderPresetIndex = idx;

    const preset = sliderTransitionPresets[idx];
    sliderTrack.style.setProperty('--slider-duration', preset.sliderDuration);
    sliderTrack.style.setProperty('--slider-ease', preset.sliderEase);
    sliderTrack.style.setProperty('--active-zoom', preset.activeZoom);
    sliderTrack.style.setProperty('--active-filter', preset.activeFilter);
    sliderTrack.style.setProperty('--active-duration', preset.activeDuration);
    sliderTrack.style.setProperty('--active-ease', preset.activeEase);
    sliderTrack.style.setProperty('--content-offset', preset.contentOffset);
    sliderTrack.style.setProperty('--content-duration', preset.contentDuration);
    sliderTrack.style.setProperty('--content-ease', preset.contentEase);
}

function renderDonationSlider() {
    const sliderTrack = document.getElementById('donationSlider');
    const indicatorsEl = document.getElementById('donationSliderIndicators');
    if (!sliderTrack) return; // Exit if not on homepage
    
    const donations = getDonations();
    
    // Filter donations with images and sort by most recent
    const donationsWithImages = donations
        .filter(d => d.image)
        .sort((a, b) => new Date(b.addedAt) - new Date(a.addedAt))
        .slice(0, 10); // Show latest 10 donations
    
    if (donationsWithImages.length === 0) {
        sliderTrack.innerHTML = `
            <div class="donation-slide">
                <img src="https://via.placeholder.com/1000x400/DC2626/FFFFFF?text=No+Donations+Yet" alt="No donations">
                <div class="donation-slide-content">
                    <div class="donation-slide-title">কোনো রক্তদান নেই</div>
                    <div class="donation-slide-subtitle">এখনো কোনো রক্তদানের ছবি পাওয়া যাচ্ছেনি</div>
                    <div class="donation-slide-date">অনুগ্রহ করুন</div>
                </div>
            </div>
        `;
        if (indicatorsEl) indicatorsEl.innerHTML = '';
        currentSlide = 0;
        if (donationSliderIntervalId) {
            clearInterval(donationSliderIntervalId);
            donationSliderIntervalId = null;
        }
        return;
    }
    
    donationSlides = donationsWithImages;
    if (currentSlide >= donationSlides.length) currentSlide = 0;
    
    sliderTrack.innerHTML = donationsWithImages.map((donation) => `
        <div class="donation-slide">
            <img src="${donation.image}" alt="${donation.donorName || 'Donor'}">
            <div class="donation-slide-content">
                <div class="donation-slide-title">${donation.donorName || 'Anonymous Donor'}</div>
                <div class="donation-slide-subtitle">Donation Number: ${donation.number}</div>
                <div class="donation-slide-date">${new Date(donation.addedAt).toLocaleDateString('bn-BD', { year: 'numeric', month: 'long', day: 'numeric' })}</div>
            </div>
        </div>
    `).join('');

    if (indicatorsEl) {
        indicatorsEl.innerHTML = donationsWithImages.map((_, index) =>
            `<div class="slider-indicator ${index === currentSlide ? 'active' : ''}" data-index="${index}"></div>`
        ).join('');

        indicatorsEl.querySelectorAll('.slider-indicator').forEach((dot) => {
            dot.onclick = () => {
                const idx = Number(dot.getAttribute('data-index'));
                if (Number.isFinite(idx)) {
                    currentSlide = idx;
                    updateSlider();
                }
            };
        });
    }

    setupSliderControls();
    updateSlider();
}

function setupSliderControls() {
    const prevBtn = document.getElementById('prevSlide');
    const nextBtn = document.getElementById('nextSlide');
    
    if (prevBtn) {
        prevBtn.onclick = () => {
            currentSlide = currentSlide > 0 ? currentSlide - 1 : donationSlides.length - 1;
            updateSlider();
        };
    }
    
    if (nextBtn) {
        nextBtn.onclick = () => {
            currentSlide = currentSlide < donationSlides.length - 1 ? currentSlide + 1 : 0;
            updateSlider();
        };
    }
    
    // Auto-play slider
    if (donationSliderIntervalId) {
        clearInterval(donationSliderIntervalId);
        donationSliderIntervalId = null;
    }

    donationSliderIntervalId = setInterval(() => {
        if (donationSlides.length > 1) {
            currentSlide = currentSlide < donationSlides.length - 1 ? currentSlide + 1 : 0;
            updateSlider();
        }
    }, 6000); // Change slide every 6 seconds
}

function updateSlider() {
    const sliderTrack = document.getElementById('donationSlider');
    if (!sliderTrack) return;

    applySliderTransitionPreset();
    
    const slideWidth = 100; // Each slide takes 100% width
    const offset = -currentSlide * slideWidth;
    
    sliderTrack.style.transform = `translateX(${offset}%)`;

    const slides = sliderTrack.querySelectorAll('.donation-slide');
    slides.forEach((slide, index) => {
        slide.classList.toggle('is-active', index === currentSlide);
    });
    
    // Update indicators
    const indicatorsEl = document.getElementById('donationSliderIndicators');
    if (indicatorsEl) {
        const indicators = indicatorsEl.querySelectorAll('.slider-indicator');
        indicators.forEach((indicator, index) => {
            indicator.classList.toggle('active', index === currentSlide);
        });
    }
}

// ==================== GALLERY RENDERING ====================
const galleryGrid = document.getElementById('galleryGrid');

function renderGallery() {
    if (!galleryGrid) return; // Exit if galleryGrid doesn't exist on this page
    
    const gallery = getGalleryImages();
    const donorPhotos = getDonorPhotos();
    const allImages = [...gallery, ...donorPhotos];

    if (allImages.length === 0) {
        galleryGrid.innerHTML = `
            <div class="gallery-card">
                <div class="gallery-placeholder"></div>
                <div class="caption">Blood Donation Camp 2024</div>
            </div>
            <div class="gallery-card">
                <div class="gallery-placeholder"></div>
                <div class="caption">Volunteer Blood Donors</div>
            </div>
            <div class="gallery-card">
                <div class="gallery-placeholder"></div>
                <div class="caption">Awareness Program</div>
            </div>
            <div class="gallery-card">
                <div class="gallery-placeholder"></div>
                <div class="caption">Blood Donation Service</div>
            </div>
            <div class="gallery-card">
                <div class="gallery-placeholder"></div>
                <div class="caption">Hospital Support</div>
            </div>
            <div class="gallery-card">
                <div class="gallery-placeholder"></div>
                <div class="caption">Emergency Blood Donation</div>
            </div>
        `;
        return;
    }

    galleryGrid.innerHTML = allImages.map((img, i) => `
        <div class="gallery-card" onclick="openLightbox('${img.data}')">
            <img src="${img.data}" alt="${img.caption || 'Blood Donation Activity'}" loading="lazy">
            <div class="caption">${img.caption || 'Blood Donation Activity'}</div>
        </div>
    `).join('');
}

// ==================== LIGHTBOX ====================
const lightbox = document.getElementById('lightbox');
const lightboxImg = document.getElementById('lightboxImg');
const lightboxClose = document.getElementById('lightboxClose');

window.openLightbox = function(src) {
    if (!lightbox || !lightboxImg) return;
    lightboxImg.src = src;
    lightbox.classList.add('active');
};

if (lightboxClose) {
    lightboxClose.addEventListener('click', () => {
        lightbox.classList.remove('active');
    });
}

if (lightbox) {
    lightbox.addEventListener('click', (e) => {
        if (e.target === lightbox) {
            lightbox.classList.remove('active');
        }
    });
}

// ==================== STATS ====================
function updateStats() {
    const count = getDonors().length;
    const statDonors = document.getElementById('statDonors');
    if (statDonors) statDonors.textContent = count;
    const adminStat = document.getElementById('adminStatDonors');
    if (adminStat) adminStat.textContent = count;
    
    const donationCount = getDonations().length;
    const adminDonationStat = document.getElementById('adminStatDonations');
    if (adminDonationStat) adminDonationStat.textContent = donationCount;
    
    const certificateCount = getCertificates().length;
    const adminCertificateStat = document.getElementById('adminStatCertificates');
    if (adminCertificateStat) adminCertificateStat.textContent = certificateCount;
}

// ==================== ADMIN LOGIN SYSTEM ====================
// Initialize default credentials if not already set
function initializeAdminCredentials() {
    if (!localStorage.getItem('chavali_admin_username') || !localStorage.getItem('chavali_admin_password')) {
        localStorage.setItem('chavali_admin_username', 'admin');
        localStorage.setItem('chavali_admin_password', 'admin123');
    }
}

// Initialize credentials immediately on script load
initializeAdminCredentials();

// Check if user is logged in
function isAdminLoggedIn() {
    return localStorage.getItem('chavali_admin_logged_in') === 'true';
}

// Show login form and hide dashboard
function showLoginForm() {
    const adminLogin = document.getElementById('adminLogin');
    const adminDashboard = document.getElementById('adminDashboard');
    if (adminLogin) adminLogin.style.display = 'flex';
    if (adminDashboard) adminDashboard.style.display = 'none';
}

// Show dashboard and hide login form
function showAdminDashboard() {
    const adminLogin = document.getElementById('adminLogin');
    const adminDashboard = document.getElementById('adminDashboard');
    if (adminLogin) adminLogin.style.display = 'none';
    if (adminDashboard) adminDashboard.style.display = 'block';
}

// Handle admin login form submission
const adminLoginForm = document.getElementById('adminLoginForm');
if (adminLoginForm) {
    adminLoginForm.addEventListener('submit', (e) => {
        e.preventDefault();
        
        const username = document.getElementById('adminUsername')?.value.trim();
        const password = document.getElementById('adminPassword')?.value.trim();
        const loginMessage = document.getElementById('loginMessage');
        
        // Get stored credentials
        const storedUsername = localStorage.getItem('chavali_admin_username');
        const storedPassword = localStorage.getItem('chavali_admin_password');
        
        // Validate credentials
        if (!username || !password) {
            if (loginMessage) {
                loginMessage.textContent = 'Please enter both username and password';
                loginMessage.style.display = 'block';
                loginMessage.style.background = '#fee2e2';
                loginMessage.style.color = '#991b1b';
                loginMessage.style.border = '1px solid #fca5a5';
            }
            return;
        }
        
        if (username === storedUsername && password === storedPassword) {
            // Login successful
            localStorage.setItem('chavali_admin_logged_in', 'true');
            
            if (loginMessage) {
                loginMessage.textContent = 'Login successful! Redirecting...';
                loginMessage.style.display = 'block';
                loginMessage.style.background = '#dcfce7';
                loginMessage.style.color = '#166534';
                loginMessage.style.border = '1px solid #86efac';
            }
            
            // Show dashboard after short delay
            setTimeout(() => {
                showAdminDashboard();
                adminLoginForm.reset();
                renderAdminDonorTable();
                renderAdminDonationTable();
                renderAdminCertificateTable();
                updateStats();
                populateCertificateDonationSelect();
                if (loginMessage) loginMessage.style.display = 'none';
            }, 500);
        } else {
            // Login failed
            if (loginMessage) {
                loginMessage.textContent = 'Invalid username or password';
                loginMessage.style.display = 'block';
                loginMessage.style.background = '#fee2e2';
                loginMessage.style.color = '#991b1b';
                loginMessage.style.border = '1px solid #fca5a5';
            }
        }
    });
}

// ==================== PASSWORD TOGGLE ====================
const passwordToggle = document.getElementById('passwordToggle');
const passwordInput = document.getElementById('adminPassword');

if (passwordToggle && passwordInput) {
    passwordToggle.addEventListener('click', (e) => {
        e.preventDefault();
        
        // Toggle password visibility
        const isPassword = passwordInput.type === 'password';
        passwordInput.type = isPassword ? 'text' : 'password';
        
        // Update toggle button appearance
        const eyeIcon = passwordToggle.querySelector('.eye-icon');
        if (eyeIcon) {
            eyeIcon.textContent = isPassword ? '🙈' : '👁️';
        }
    });
}

// Toggle password visibility for change password form
const passwordFields = [
    { toggleId: 'currentPasswordToggle', inputId: 'currentPassword' },
    { toggleId: 'newPasswordToggle', inputId: 'newPassword' },
    { toggleId: 'confirmPasswordToggle', inputId: 'confirmPassword' }
];

passwordFields.forEach(field => {
    const toggle = document.getElementById(field.toggleId);
    const input = document.getElementById(field.inputId);
    
    if (toggle && input) {
        toggle.addEventListener('click', (e) => {
            e.preventDefault();
            
            // Toggle password visibility
            const isPassword = input.type === 'password';
            input.type = isPassword ? 'text' : 'password';
            
            // Update toggle button appearance
            const eyeIcon = toggle.querySelector('.eye-icon');
            if (eyeIcon) {
                eyeIcon.textContent = isPassword ? '🙈' : '👁️';
            }
        });
    }
});

// Initialize admin page on load
window.addEventListener('load', () => {
    const adminDashboard = document.getElementById('adminDashboard');
    const adminLogin = document.getElementById('adminLogin');
    
    if (adminDashboard || adminLogin) {
        // Check if user is logged in
        if (isAdminLoggedIn()) {
            showAdminDashboard();
            renderAdminDonorTable();
            renderAdminDonationTable();
            renderAdminCertificateTable();
            updateStats();
            populateCertificateDonationSelect();
        } else {
            showLoginForm();
        }
    }
});

// ==================== ADMIN LOGOUT ====================
const adminLogoutBtn = document.getElementById('adminLogoutBtn');
if (adminLogoutBtn) {
    adminLogoutBtn.addEventListener('click', () => {
        if (confirm('Are you sure you want to logout?')) {
            localStorage.removeItem('chavali_admin_logged_in');
            
            // Redirect to homepage
            window.location.href = '../index.html';
        }
    });
}

// ==================== ADMIN TABS ====================
const adminTabs = document.querySelectorAll('.admin-tab');
if (adminTabs.length > 0) {
    adminTabs.forEach(tab => {
        tab.addEventListener('click', () => {
            document.querySelectorAll('.admin-tab').forEach(t => t.classList.remove('active'));
            document.querySelectorAll('.admin-panel').forEach(p => p.classList.remove('active'));
            tab.classList.add('active');
            document.getElementById(tab.dataset.tab).classList.add('active');
        });
    });
}

// ==================== ADMIN: DONATION LIST ====================
function renderAdminDonationTable() {
    const tbody = document.getElementById('adminDonationBody');
    if (!tbody) return; // Exit if not on admin page
    
    const donations = getDonations();

    if (donations.length === 0) {
        tbody.innerHTML = '<tr><td colspan="10" style="text-align:center; padding:30px; color:#999;">No donation records found</td></tr>';
        return;
    }

    tbody.innerHTML = donations.map((d, i) => `
        <tr>
            <td>${i + 1}</td>
            <td>${d.donorName || 'N/A'}</td>
            <td>${d.donorPhone || 'N/A'}</td>
            <td>${d.donorAddress || 'N/A'}</td>
            <td>${d.number}</td>
            <td><span class="donor-blood">${d.bloodGroup}</span></td>
            <td>${d.date}</td>
            <td>${d.image ? '<img src="' + d.image + '" style="width:50px; height:50px; object-fit:cover; border-radius:4px;" alt="Donation Image">' : 'No Image'}</td>
            <td><button class="delete-btn" onclick="deleteDonation(${d.id})">Delete</button></td>
            <td><button class="edit-btn" onclick="editDonation(${d.id})">Edit</button></td>
        </tr>
    `).join('');
}

window.editDonation = function(id) {
    const donations = getDonations();
    const donation = donations.find(d => d.id === id);
    
    if (!donation) return;
    
    // Populate form with donation data
    document.getElementById('addDonorName').value = donation.donorName || '';
    document.getElementById('addDonorPhone').value = donation.donorPhone || '';
    document.getElementById('addDonorAddress').value = donation.donorAddress || '';
    document.getElementById('addDonationNumber').value = donation.number;
    document.getElementById('addDonationBlood').value = donation.bloodGroup;
    document.getElementById('addDonationDate').value = donation.date;
    
    // Show existing image if any
    if (donation.image) {
        const preview = document.getElementById('donationImagePreview');
        preview.innerHTML = `
            <div style="display:flex; align-items:center; gap:12px; padding:12px; background:#f0f0f0; border-radius:8px;">
                <img src="${donation.image}" style="width:80px; height:80px; object-fit:cover; border-radius:6px;">
                <div>
                    <p style="margin:0; font-weight:500;">Current Image</p>
                    <p style="margin:4px 0 0 0; font-size:0.85rem; color:#666;">New image will replace this one</p>
                </div>
            </div>
        `;
    }
    
    // Store editing ID
    addDonationForm.editingId = id;
    
    // Change submit button text
    const submitBtn = addDonationForm.querySelector('button[type="submit"]');
    submitBtn.textContent = 'Update Donation';
    
    // Show cancel button
    const cancelBtn = document.getElementById('cancelDonationBtn');
    if (cancelBtn) {
        cancelBtn.style.display = 'inline-block';
    }
    
    // Switch to donation tab
    document.querySelectorAll('.admin-tab').forEach(t => t.classList.remove('active'));
    document.querySelectorAll('.admin-panel').forEach(p => p.classList.remove('active'));
    document.querySelector('[data-tab="adminAddDonation"]').classList.add('active');
    document.getElementById('adminAddDonation').classList.add('active');
    
    // Scroll to form
    document.getElementById('adminAddDonation').scrollIntoView({ behavior: 'smooth' });
};

window.deleteDonation = function(id) {
    if (confirm('Are you sure you want to delete this donation record?')) {
        let donations = getDonations();
        donations = donations.filter(d => d.id !== id);
        saveDonations(donations);
        renderAdminDonationTable();
        updateStats();
    }
};

// ==================== ADMIN: DONOR TABLE ====================
function renderAdminDonorTable() {
    const tbody = document.getElementById('adminDonorBody');
    if (!tbody) return; // Exit if not on admin page
    
    const donors = getDonors();

    if (donors.length === 0) {
        tbody.innerHTML = '<tr><td colspan="7" style="text-align:center; padding:30px; color:#999;">No donors registered</td></tr>';
        return;
    }

    tbody.innerHTML = donors.map((d, i) => `
        <tr>
            <td>${i + 1}</td>
            <td>${d.name}</td>
            <td>${d.mobile}</td>
            <td><span class="donor-blood">${d.bloodGroup}</span></td>
            <td>${d.address}</td>
            <td>${d.lastDonation || 'Not mentioned'}</td>
            <td><button class="delete-btn" onclick="deleteDonor(${d.id})">Delete</button></td>
        </tr>
    `).join('');
}

window.deleteDonor = function(id) {
    if (confirm('Are you sure you want to delete this donor?')) {
        let donors = getDonors();
        donors = donors.filter(d => d.id !== id);
        saveDonors(donors);
        renderAdminDonorTable();
        renderDonorList(currentFilter);
        updateStats();
    }
};

// ==================== ADMIN: ADD DONOR FORM ====================
// ==================== CERTIFICATE STORAGE ====================
function getCertificates() {
    try {
        const data = localStorage.getItem('chavali_certificates');
        return data ? JSON.parse(data) : [];
    } catch (err) {
        return [];
    }
}

function saveCertificates(certificates) {
    try {
        localStorage.setItem('chavali_certificates', JSON.stringify(certificates));
    } catch (err) {
        throw new Error('Storage full or unavailable');
    }
}

function saveCertificate(certificate) {
    const certificates = getCertificates();
    certificates.push(certificate);
    saveCertificates(certificates);
}

// ==================== ADMIN: ADD DONATION ====================
const addDonationForm = document.getElementById('adminAddDonationForm');
const donationImageInput = document.getElementById('donationImageInput');

const addDonorPhoneInput = document.getElementById('addDonorPhone');
const donorPhoneList = document.getElementById('donorPhoneList');

function renderDonorPhoneSuggestions() {
    if (!donorPhoneList) return;
    const donors = getDonors();
    donorPhoneList.innerHTML = donors
        .filter(d => d && d.mobile)
        .map(d => {
            const normalized = normalizePhone(d.mobile);
            const value = normalized || d.mobile;
            const label = `${d.mobile}${d.name ? ' - ' + d.name : ''}`;
            return `<option value="${value}">${label}</option>`;
        })
        .join('');
}

function fillDonationFormFromPhone(phone) {
    const phoneKey = normalizePhone(phone);
    if (!phoneKey) return;
    const donors = getDonors();
    const match = donors.find(d => normalizePhone(d.mobile) === phoneKey);
    if (!match) return;

    const nameEl = document.getElementById('addDonorName');
    const addressEl = document.getElementById('addDonorAddress');
    const bloodEl = document.getElementById('addDonationBlood');

    if (nameEl && !nameEl.value) nameEl.value = match.name || '';
    if (addressEl && !addressEl.value) addressEl.value = match.address || '';
    if (bloodEl && !bloodEl.value) bloodEl.value = match.bloodGroup || '';
}

if (addDonorPhoneInput) {
    addDonorPhoneInput.addEventListener('focus', renderDonorPhoneSuggestions);
    addDonorPhoneInput.addEventListener('click', renderDonorPhoneSuggestions);
    addDonorPhoneInput.addEventListener('input', (e) => {
        renderDonorPhoneSuggestions();
        fillDonationFormFromPhone(e.target.value);
    });
    addDonorPhoneInput.addEventListener('change', (e) => {
        fillDonationFormFromPhone(e.target.value);
    });
}
const donationImageUploadArea = document.getElementById('donationImageUploadArea');

if (donationImageUploadArea) {
    donationImageUploadArea.addEventListener('click', () => donationImageInput?.click());
    
    donationImageUploadArea.addEventListener('dragover', (e) => {
        e.preventDefault();
        donationImageUploadArea.style.borderColor = 'var(--primary)';
        donationImageUploadArea.style.background = 'var(--primary-light)';
    });
    
    donationImageUploadArea.addEventListener('dragleave', () => {
        donationImageUploadArea.style.borderColor = '#ddd';
        donationImageUploadArea.style.background = '#f9f9f9';
    });
    
    donationImageUploadArea.addEventListener('drop', (e) => {
        e.preventDefault();
        donationImageUploadArea.style.borderColor = '#ddd';
        donationImageUploadArea.style.background = '#f9f9f9';
        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            handleDonationImageFile(e.dataTransfer.files[0]);
        }
    });
}

if (donationImageInput) {
    donationImageInput.addEventListener('change', (e) => {
        if (e.target.files && e.target.files[0]) {
            handleDonationImageFile(e.target.files[0]);
        }
    });
}

function handleDonationImageFile(file) {
    if (file.size > 2 * 1024 * 1024) {
        showAddDonationMessage('File size must be less than 2MB!', 'error');
        return;
    }
    
    const reader = new FileReader();
    reader.onload = (e) => {
        const preview = document.getElementById('donationImagePreview');
        if (preview) {
            preview.innerHTML = `
                <div style="display:flex; align-items:center; gap:12px; padding:12px; background:#f0f0f0; border-radius:8px;">
                    <img src="${e.target.result}" style="width:80px; height:80px; object-fit:cover; border-radius:6px;">
                    <div>
                        <p style="margin:0; font-weight:500;">Image selected</p>
                        <p style="margin:4px 0 0 0; font-size:0.85rem; color:#666;">${file.name}</p>
                        <button type="button" style="margin-top:6px; padding:4px 12px; background:#DC2626; color:white; border:none; border-radius:4px; cursor:pointer; font-size:0.85rem;" onclick="clearDonationImage()">Remove</button>
                    </div>
                </div>
            `;
            addDonationForm.donationImage = e.target.result; // Store base64 in form object
        }
    };
    reader.readAsDataURL(file);
}

function clearDonationImage() {
    if (donationImageInput) donationImageInput.value = '';
    const preview = document.getElementById('donationImagePreview');
    if (preview) preview.innerHTML = '';
    if (addDonationForm) addDonationForm.donationImage = null;
}

if (addDonationForm) {
    addDonationForm.addEventListener('submit', (e) => {
        e.preventDefault();
        
        const donorName = document.getElementById('addDonorName')?.value.trim();
        const donorPhone = document.getElementById('addDonorPhone')?.value.trim();
        const donorAddress = document.getElementById('addDonorAddress')?.value.trim();
        const donationNumber = document.getElementById('addDonationNumber')?.value.trim();
        const bloodGroup = document.getElementById('addDonationBlood')?.value;
        const donationDate = document.getElementById('addDonationDate')?.value;
        const donationImage = addDonationForm.donationImage || null;
        
        if (!donorName || !donorPhone || !donorAddress || !donationNumber || !bloodGroup || !donationDate) {
            showAddDonationMessage('Please fill all required fields', 'error');
            return;
        }
        
        const isEditing = addDonationForm.editingId;
        let donations = getDonations();
        
        if (isEditing) {
            // Update existing donation
            const index = donations.findIndex(d => d.id === isEditing);
            if (index !== -1) {
                donations[index] = {
                    ...donations[index],
                    donorName: donorName,
                    donorPhone: donorPhone,
                    donorAddress: donorAddress,
                    number: donationNumber,
                    bloodGroup: bloodGroup,
                    date: donationDate,
                    image: donationImage || donations[index].image,
                    updatedAt: new Date().toISOString()
                };
                showAddDonationMessage('Donation updated successfully!', 'success');
            }
        } else {
            // Add new donation
            const newDonation = {
                id: Date.now(),
                donorName: donorName,
                donorPhone: donorPhone,
                donorAddress: donorAddress,
                number: donationNumber,
                bloodGroup: bloodGroup,
                date: donationDate,
                image: donationImage,
                addedAt: new Date().toISOString()
            };
            donations.push(newDonation);
            showAddDonationMessage('Donation added successfully!', 'success');
        }
        
        try {
            saveDonations(donations);

            upsertDonorFromDonation({
                donorName,
                donorPhone,
                donorAddress,
                bloodGroup,
                donationDate
            });

            resetDonationForm();
            renderAdminDonationTable();
            renderAdminDonorTable();
            updateStats();
            renderDonationSlider(); // Update slider with new donation
            renderDonorPhoneSuggestions();
            
            // Clear success message after 3 seconds
            setTimeout(() => {
                showAddDonationMessage('', '');
            }, 3000);
        } catch (err) {
            showAddDonationMessage('Error saving donation. Storage may be full.', 'error');
        }
    });
}

function resetDonationForm() {
    addDonationForm.reset();
    clearDonationImage();
    delete addDonationForm.editingId;
    
    // Reset submit button text
    const submitBtn = addDonationForm.querySelector('button[type="submit"]');
    submitBtn.textContent = 'Add Donation';
    
    // Hide cancel button
    const cancelBtn = document.getElementById('cancelDonationBtn');
    if (cancelBtn) {
        cancelBtn.style.display = 'none';
    }
}

// Cancel button functionality
const cancelDonationBtn = document.getElementById('cancelDonationBtn');
if (cancelDonationBtn) {
    cancelDonationBtn.addEventListener('click', () => {
        resetDonationForm();
        showAddDonationMessage('', '');
    });
}

function showAddDonationMessage(message, type) {
    const messageEl = document.getElementById('addDonationMessage');
    if (!messageEl) return;
    
    if (!message) {
        messageEl.style.display = 'none';
        messageEl.textContent = '';
        return;
    }
    
    messageEl.textContent = message;
    messageEl.style.display = 'block';
    
    if (type === 'success') {
        messageEl.style.background = '#dcfce7';
        messageEl.style.color = '#166534';
        messageEl.style.border = '1px solid #86efac';
    } else if (type === 'error') {
        messageEl.style.background = '#fee2e2';
        messageEl.style.color = '#991b1b';
        messageEl.style.border = '1px solid #fca5a5';
    }
}

// ==================== OLD DONOR FORM (REMOVE) ====================
const galleryUploadArea = document.getElementById('galleryUploadArea');
const galleryFileInput = document.getElementById('galleryFileInput');
const galleryCaption = document.getElementById('galleryCaption');

if (galleryUploadArea) {
    galleryUploadArea.addEventListener('click', () => galleryFileInput.click());

    galleryUploadArea.addEventListener('dragover', (e) => {
        e.preventDefault();
        galleryUploadArea.style.borderColor = 'var(--primary)';
        galleryUploadArea.style.background = 'var(--primary-light)';
    });

    galleryUploadArea.addEventListener('dragleave', () => {
        galleryUploadArea.style.borderColor = '';
        galleryUploadArea.style.background = '';
    });

    galleryUploadArea.addEventListener('drop', (e) => {
        e.preventDefault();
        galleryUploadArea.style.borderColor = '';
        galleryUploadArea.style.background = '';
        handleGalleryFiles(e.dataTransfer.files);
    });
}

if (galleryFileInput) {
    galleryFileInput.addEventListener('change', (e) => {
        handleGalleryFiles(e.target.files);
        e.target.value = '';
    });
}

function handleGalleryFiles(files) {
    if (!galleryCaption) return;
    const caption = galleryCaption.value.trim();
    Array.from(files).forEach(file => {
        if (file.size > 2 * 1024 * 1024) {
            alert('File size must be less than 2MB!');
            return;
        }
        const reader = new FileReader();
        reader.onload = (e) => {
            const images = getGalleryImages();
            images.push({
                id: Date.now() + Math.random(),
                data: e.target.result,
                caption: caption || 'Blood Donation Activity',
                uploadedAt: new Date().toISOString()
            });
            try {
                saveGalleryImages(images);
                renderAdminGalleryPreview();
                renderGallery();
                updateStats();
                galleryCaption.value = '';
            } catch (err) {
                alert('Storage full! Image could not be saved.');
            }
        };
        reader.readAsDataURL(file);
    });
}

function renderAdminGalleryPreview() {
    const images = getGalleryImages();
    const preview = document.getElementById('galleryPreview');
    if (!preview) return;

    if (images.length === 0) {
        preview.innerHTML = '<p style="color:#999; grid-column:1/-1; text-align:center;">No images uploaded</p>';
        return;
    }

    preview.innerHTML = images.map(img => `
        <div class="upload-thumb">
            <img src="${img.data}" alt="${img.caption}">
            <button class="remove-img" onclick="removeGalleryImage(${img.id})">✕</button>
        </div>
    `).join('');
}

window.removeGalleryImage = function(id) {
    let images = getGalleryImages();
    images = images.filter(img => img.id !== id);
    saveGalleryImages(images);
    renderAdminGalleryPreview();
    renderGallery();
    updateStats();
};

// ==================== ADMIN: CERTIFICATE TABLE ====================
function renderAdminCertificateTable() {
    const tbody = document.getElementById('adminCertificateBody');
    if (!tbody) return; // Exit if not on admin page
    
    const certificates = getCertificates();

    if (certificates.length === 0) {
        tbody.innerHTML = '<tr><td colspan="6" style="text-align:center; padding:30px; color:#999;">No certificates generated</td></tr>';
        return;
    }

    tbody.innerHTML = certificates.map((cert, i) => `
        <tr>
            <td>${i + 1}</td>
            <td>${cert.donorName}</td>
            <td><span class="donor-blood">${cert.bloodGroup}</span></td>
            <td>${new Date(cert.donationDate).toLocaleDateString('en-US', { 
                year: 'numeric', 
                month: 'short', 
                day: 'numeric' 
            })}</td>
            <td>${new Date(cert.generatedAt).toLocaleDateString('en-US', { 
                year: 'numeric', 
                month: 'short', 
                day: 'numeric' 
            })}</td>
            <td>
                <button class="view-btn" onclick="viewCertificate(${cert.id})">View</button>
                <button class="delete-btn" onclick="deleteCertificate(${cert.id})">Delete</button>
            </td>
        </tr>
    `).join('');
}

window.viewCertificate = function(id) {
    window.open(`certificate.html?id=${id}`, '_blank');
};

window.deleteCertificate = function(id) {
    if (confirm('Are you sure you want to delete this certificate?')) {
        let certificates = getCertificates();
        certificates = certificates.filter(c => c.id !== id);
        saveCertificates(certificates);
        renderAdminCertificateTable();
        updateStats();
    }
};

// Donor photo upload functionality removed - elements no longer exist in admin panel

// ==================== KEYBOARD SHORTCUTS ====================
document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
        if (lightbox) lightbox.classList.remove('active');
        const adminDashboard = document.getElementById('adminDashboard');
        if (adminDashboard && adminDashboard.classList.contains('active')) {
            adminDashboard.classList.remove('active');
            document.body.style.overflow = '';
        }
    }
});

// ==================== ADMIN: TAB SWITCHING ====================
document.addEventListener('DOMContentLoaded', () => {
    // Tab switching functionality
    const adminTabs = document.querySelectorAll('.admin-tab');
    adminTabs.forEach(tab => {
        tab.addEventListener('click', () => {
            const targetTab = tab.getAttribute('data-tab');
            
            // Remove active class from all tabs and panels
            document.querySelectorAll('.admin-tab').forEach(t => t.classList.remove('active'));
            document.querySelectorAll('.admin-panel').forEach(p => p.classList.remove('active'));
            
            // Add active class to clicked tab and corresponding panel
            tab.classList.add('active');
            const targetPanel = document.getElementById(targetTab);
            if (targetPanel) {
                targetPanel.classList.add('active');
            }
        });
    });
    
    renderDonorList();
    renderGallery();
    renderDonationSlider();
    updateStats();
});

// ==================== CERTIFICATE GENERATOR ====================
function populateCertificateDonationSelect() {
    const select = document.getElementById('certificateDonationSelect');
    if (!select) return;
    
    const donations = getDonations();
    select.innerHTML = '<option value="">Select a donation record</option>';
    
    donations.forEach(donation => {
        const option = document.createElement('option');
        option.value = donation.id;
        option.textContent = `${donation.donorName} - ${donation.bloodGroup} - ${donation.date} (ID: ${donation.number})`;
        select.appendChild(option);
    });
}
function generateCertificate(donationId, message) {
    const donations = getDonations();
    const donation = donations.find(d => d.id === parseInt(donationId));
    
    if (!donation) return null;

    const fetchAsDataUrl = (url, fallbackDataUrl) => {
        return fetch(url)
            .then(response => response.blob())
            .then(blob => new Promise((resolve) => {
                const reader = new FileReader();
                reader.onload = () => resolve(reader.result);
                reader.readAsDataURL(blob);
            }))
            .catch(() => fallbackDataUrl);
    };

    const logoPromise = fetchAsDataUrl(
        '../uploads/logo.png',
        'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTIwIiBoZWlnaHQ9IjEyMCIgdmlld0JveD0iMCAwIDEyMCAxMjAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxjaXJjbGUgY3g9IjYwIiBjeT0iNjAiIHI9IjYwIiBmaWxsPSIjZGMyNjI2Ii8+Cjx0ZXh0IHg9IjYwIiB5PSI3NSIgZm9udC1mYW1pbHk9IkFyaWFsLCBzYW5zLXNlcmlmIiBmb250LXNpemU9IjQwIiBmaWxsPSJ3aGl0ZSIgdGV4dC1hbmNob3I9Im1pZGRsZSI+Q0I8L3RleHQ+Cjwvc3ZnPg=='
    );

    const signaturePromise = fetchAsDataUrl(
        '../uploads/authorized%20signature.png',
        ''
    );

    // Fetch certificate background SVG (Certificate.svg)
    const backgroundPromise = fetch('../uploads/Certificate.svg')
        .then(response => response.text())
        .catch(() => null);

    return Promise.all([logoPromise, signaturePromise, backgroundPromise]).then(([logoDataUrl, signatureDataUrl, backgroundSvg]) => {
        const donationDate = new Date(donation.date);
        const donationDateLabel = isNaN(donationDate.getTime())
            ? (donation.date || '')
            : donationDate.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
        const issuedOnLabel = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
        const safeMessage = message ? String(message).trim() : '';

        // Use Certificate.svg as background
        const backgroundDataUrl = backgroundSvg ? `data:image/svg+xml;base64,${btoa(backgroundSvg)}` : '';

        const certificateHtml = `
            <style>
                @page { size: A4 landscape; margin: 0; }
                @media print {
                    html, body { margin: 0; padding: 0; }
                    body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
                }
                .cb-cert {
                    position: relative;
                    width: 842px;
                    height: 595px;
                    margin: 0 auto;
                    overflow: hidden;
                    font-family: 'Noto Sans Bengali', Arial, sans-serif;
                    background: #fff;
                }
                .cb-cert-bg {
                    position: absolute;
                    top: 0; left: 0; width: 100%; height: 100%; z-index: 1;
                    background-image: url('${backgroundDataUrl}');
                    background-size: cover;
                    background-position: center;
                    background-repeat: no-repeat;
                    opacity: 1;
                }
                .cb-cert-content {
                    position: relative;
                    z-index: 2;
                    width: 100%;
                    height: 100%;
                    display: flex;
                    flex-direction: column;
                    justify-content: center;
                    align-items: center;
                    padding: 60px 40px 40px 40px;
                    box-sizing: border-box;
                }
                .cb-cert-title {
                    font-size: 40px;
                    font-weight: 700;
                    color: #dc2626;
                    text-align: center;
                    margin-bottom: 8px;
                    text-shadow: 2px 2px 4px rgba(0,0,0,0.08);
                    letter-spacing: 2px;
                }
                .cb-cert-subtitle {
                    font-size: 22px;
                    color: #374151;
                    text-align: center;
                    margin-bottom: 32px;
                    font-weight: 500;
                }
                .cb-cert-recipient {
                    font-size: 30px;
                    font-weight: 700;
                    color: #1f2937;
                    text-align: center;
                    margin-bottom: 18px;
                    padding: 12px 32px;
                    background: rgba(255,255,255,0.92);
                    border-radius: 10px;
                    box-shadow: 0 2px 8px rgba(0,0,0,0.04);
                }
                .cb-cert-details {
                    text-align: center;
                    margin-bottom: 28px;
                }
                .cb-cert-detail-item {
                    font-size: 18px;
                    color: #4b5563;
                    margin: 6px 0;
                }
                .cb-cert-message {
                    font-size: 18px;
                    color: #374151;
                    text-align: center;
                    max-width: 600px;
                    margin-bottom: 32px;
                    padding: 18px;
                    background: rgba(255,255,255,0.85);
                    border-radius: 10px;
                    line-height: 1.6;
                    box-shadow: 0 1px 4px rgba(0,0,0,0.03);
                }
                .cb-cert-footer {
                    position: absolute;
                    bottom: 40px;
                    left: 0;
                    right: 0;
                    display: flex;
                    justify-content: space-between;
                    align-items: flex-end;
                    padding: 0 60px;
                    box-sizing: border-box;
                }
                .cb-cert-signature {
                    text-align: center;
                }
                .cb-cert-signature-line {
                    width: 200px;
                    height: 1px;
                    background: #374151;
                    margin-bottom: 5px;
                }
                .cb-cert-signature-text {
                    font-size: 14px;
                    color: #6b7280;
                }
                .cb-cert-date {
                    text-align: right;
                    font-size: 16px;
                    color: #4b5563;
                }
                .cb-cert-logo {
                    position: absolute;
                    top: 30px;
                    left: 30px;
                    width: 70px;
                    height: 70px;
                    border-radius: 10px;
                    object-fit: contain;
                    background: #fff;
                    box-shadow: 0 2px 8px rgba(0,0,0,0.06);
                }
                .cb-cert-id {
                    position: absolute;
                    top: 30px;
                    right: 30px;
                    font-size: 14px;
                    color: #6b7280;
                    background: rgba(255,255,255,0.92);
                    padding: 7px 16px;
                    border-radius: 6px;
                    font-weight: 500;
                }
            </style>
            <div class="cb-cert">
                <div class="cb-cert-bg"></div>
                <img src="${logoDataUrl}" alt="Logo" class="cb-cert-logo">
                <div class="cb-cert-id">Certificate ID: ${donation.number}</div>
                <div class="cb-cert-content">
                    <h1 class="cb-cert-title">Blood Donation Certificate</h1>
                    <p class="cb-cert-subtitle">Certificate of Appreciation</p>
                    <div class="cb-cert-recipient">${donation.donorName}</div>
                    <div class="cb-cert-details">
                        <div class="cb-cert-detail-item"><strong>Blood Group:</strong> ${donation.bloodGroup}</div>
                        <div class="cb-cert-detail-item"><strong>Donation Date:</strong> ${donationDateLabel}</div>
                        <div class="cb-cert-detail-item"><strong>Contact:</strong> ${donation.donorPhone}</div>
                    </div>
                    ${safeMessage ? `<div class="cb-cert-message">${safeMessage}</div>` : ''}
                    <div class="cb-cert-footer">
                        <div class="cb-cert-signature">
                            ${signatureDataUrl ? `<img src="${signatureDataUrl}" alt="Signature" style="max-height: 60px; margin-bottom: 5px;">` : '<div class="cb-cert-signature-line"></div>'}
                            <div class="cb-cert-signature-text">Authorized Signature</div>
                        </div>
                        <div class="cb-cert-date">
                            <div>Issued on: ${issuedOnLabel}</div>
                        </div>
                    </div>
                </div>
            </div>
        `;

        return certificateHtml;
    });
}

function downloadCertificate() {
    const certificateContainer = document.getElementById('certificateContainer');
    if (!certificateContainer) return;
    
    // Use html2canvas to capture the certificate
    html2canvas(certificateContainer, {
        scale: 2,
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#ffffff'
    }).then(canvas => {
        const link = document.createElement('a');
        link.download = 'blood_donation_certificate.png';
        link.href = canvas.toDataURL('image/png');
        link.click();
    }).catch(err => {
        console.error('Error generating certificate image:', err);
        alert('Error generating certificate. Please try again.');
    });
}

function printCertificate() {
    const certificateContainer = document.getElementById('certificateContainer');
    if (!certificateContainer) return;
    
    const printWindow = window.open('', '_blank');
    printWindow.document.write(`
        <html>
            <head>
                <title>Blood Donation Certificate</title>
                <style>
                    @page { size: A4 landscape; margin: 10mm; }
                    html, body { margin: 0; padding: 0; }
                    body { padding: 10mm; font-family: Arial, sans-serif; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
                    .certificate { width: 297mm; min-height: 210mm; margin: 0 auto; }
                </style>
            </head>
            <body>
                <div class="certificate">
                    ${certificateContainer.innerHTML}
                </div>
            </body>
        </html>
    `);
    printWindow.document.close();
    printWindow.print();
}

// Certificate form handling
const certificateForm = document.getElementById('certificateForm');
if (certificateForm) {
    certificateForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const donationId = document.getElementById('certificateDonationSelect')?.value;
        const message = document.getElementById('certificateMessage')?.value.trim();
        
        if (!donationId) {
            showCertificateMessage('Please select a donation record', 'error');
            return;
        }
        
        try {
            const certificateHtml = await generateCertificate(donationId, message);
            if (certificateHtml) {
                const container = document.getElementById('certificateContainer');
                const preview = document.getElementById('certificatePreview');
                
                if (container && preview) {
                    container.innerHTML = certificateHtml;
                    preview.style.display = 'block';
                    showCertificateMessage('Certificate generated successfully!', 'success');
                    
                    // Save certificate to localStorage
                    const donations = getDonations();
                    const donation = donations.find(d => d.id === parseInt(donationId));
                    
                    if (donation) {
                        const certificate = {
                            id: Date.now(),
                            donationId: parseInt(donationId),
                            donorName: donation.donorName,
                            bloodGroup: donation.bloodGroup,
                            donationDate: donation.date,
                            phone: donation.donorPhone,
                            address: donation.donorAddress,
                            donationNumber: donation.number,
                            message: message,
                            htmlContent: certificateHtml,
                            generatedAt: new Date().toISOString()
                        };
                        
                        saveCertificate(certificate);
                        renderAdminCertificateTable();
                        updateStats();
                    }
                    
                    // Scroll to certificate
                    preview.scrollIntoView({ behavior: 'smooth' });
                }
            } else {
                showCertificateMessage('Error generating certificate', 'error');
            }
        } catch (error) {
            console.error('Certificate generation error:', error);
            showCertificateMessage('Error loading certificate resources', 'error');
        }
    });
}

// Certificate action buttons
const downloadBtn = document.getElementById('downloadCertificateBtn');
const printBtn = document.getElementById('printCertificateBtn');

if (downloadBtn) {
    downloadBtn.addEventListener('click', downloadCertificate);
}

if (printBtn) {
    printBtn.addEventListener('click', printCertificate);
}

// ==================== ADMIN: CHANGE PASSWORD ====================
const changePasswordForm = document.getElementById('changePasswordForm');
if (changePasswordForm) {
    changePasswordForm.addEventListener('submit', (e) => {
        e.preventDefault();
        
        const currentPassword = document.getElementById('currentPassword')?.value;
        const newPassword = document.getElementById('newPassword')?.value;
        const confirmPassword = document.getElementById('confirmPassword')?.value;
        const messageEl = document.getElementById('changePasswordMessage');
        
        // Validate input
        if (!currentPassword || !newPassword || !confirmPassword) {
            showPasswordMessage('Please fill all fields', 'error', messageEl);
            return;
        }
        
        if (newPassword.length < 6) {
            showPasswordMessage('New password must be at least 6 characters long', 'error', messageEl);
            return;
        }
        
        if (newPassword !== confirmPassword) {
            showPasswordMessage('New passwords do not match', 'error', messageEl);
            return;
        }
        
        // Verify current password
        const storedPassword = localStorage.getItem('chavali_admin_password');
        if (currentPassword !== storedPassword) {
            showPasswordMessage('Current password is incorrect', 'error', messageEl);
            return;
        }
        
        // Update password
        localStorage.setItem('chavali_admin_password', newPassword);
        showPasswordMessage('Password changed successfully!', 'success', messageEl);
        changePasswordForm.reset();
        
        // Hide message after 3 seconds
        setTimeout(() => {
            messageEl.style.display = 'none';
        }, 3000);
    });
}

function showCertificateMessage(message, type) {
    const messageEl = document.getElementById('certificateMessageDisplay');
    if (!messageEl) return;
    
    if (!message) {
        messageEl.style.display = 'none';
        messageEl.textContent = '';
        return;
    }
    
    messageEl.textContent = message;
    messageEl.style.display = 'block';
    
    if (type === 'success') {
        messageEl.style.background = '#dcfce7';
        messageEl.style.color = '#166534';
        messageEl.style.border = '1px solid #86efac';
    } else if (type === 'error') {
        messageEl.style.background = '#fee2e2';
        messageEl.style.color = '#991b1b';
        messageEl.style.border = '1px solid #fca5a5';
    }
}

function showPasswordMessage(message, type, messageEl) {
    if (!messageEl) return;
    
    messageEl.textContent = message;
    messageEl.style.display = 'block';
    
    // Remove previous type classes
    messageEl.classList.remove('success', 'error');
    
    if (type === 'success') {
        messageEl.style.background = '#dcfce7';
        messageEl.style.color = '#166534';
        messageEl.style.border = '1px solid #86efac';
        messageEl.style.borderLeftColor = '#16a34a';
        messageEl.classList.add('success');
    } else if (type === 'error') {
        messageEl.style.background = '#fee2e2';
        messageEl.style.color = '#991b1b';
        messageEl.style.border = '1px solid #fca5a5';
        messageEl.style.borderLeftColor = '#dc2626';
        messageEl.classList.add('error');
    }
}

function showCertificateMessage(message, type) {
    const messageEl = document.getElementById('certificateMessageDisplay');
    if (!messageEl) return;
    
    if (!message) {
        messageEl.style.display = 'none';
        messageEl.textContent = '';
        return;
    }
    
    messageEl.textContent = message;
    messageEl.style.display = 'block';
    
    if (type === 'success') {
        messageEl.style.background = '#dcfce7';
        messageEl.style.color = '#166534';
        messageEl.style.border = '1px solid #86efac';
    } else if (type === 'error') {
        messageEl.style.background = '#fee2e2';
        messageEl.style.color = '#991b1b';
        messageEl.style.border = '1px solid #fca5a5';
    }
}

