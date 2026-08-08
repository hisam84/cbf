// ==============================================================================
// Chavali Blood Foundation (চাঁভালি রক্ত ফাউন্ডেশন)
// Frontend Client Layer with Neon PostgreSQL Backend Integration & Offline Cache
// ==============================================================================

// ==================== API CLIENT LAYER ====================
const API = {
    baseUrl: '/api',

    getToken() {
        return localStorage.getItem('chavali_admin_token') || sessionStorage.getItem('chavali_admin_token');
    },

    setToken(token) {
        if (token) {
            localStorage.setItem('chavali_admin_token', token);
        } else {
            localStorage.removeItem('chavali_admin_token');
        }
    },

    getAuthHeaders() {
        const headers = { 'Content-Type': 'application/json' };
        const token = this.getToken();
        if (token) {
            headers['Authorization'] = `Bearer ${token}`;
        }
        return headers;
    },

    async request(endpoint, options = {}) {
        try {
            const url = `${this.baseUrl}${endpoint}`;
            const res = await fetch(url, {
                ...options,
                headers: {
                    ...this.getAuthHeaders(),
                    ...(options.headers || {})
                }
            });
            const data = await res.json();
            return { ok: res.ok, status: res.status, ...data };
        } catch (err) {
            console.warn(`API request to ${endpoint} failed (using offline fallback):`, err.message);
            return { ok: false, offline: true, error: err.message };
        }
    },

    // Health & DB status
    async checkHealth() {
        return await this.request('/health');
    },

    // Stats
    async getStats() {
        return await this.request('/stats');
    },

    // Donors
    async getDonors(bloodGroup = 'all') {
        const query = bloodGroup && bloodGroup !== 'all' ? `?bloodGroup=${encodeURIComponent(bloodGroup)}` : '';
        return await this.request(`/donors${query}`);
    },

    async createDonor(donorData) {
        return await this.request('/donors', {
            method: 'POST',
            body: JSON.stringify(donorData)
        });
    },

    async updateDonor(id, donorData) {
        return await this.request(`/donors/${id}`, {
            method: 'PUT',
            body: JSON.stringify(donorData)
        });
    },

    async deleteDonor(id) {
        return await this.request(`/donors/${id}`, {
            method: 'DELETE'
        });
    },

    // Donations
    async getDonations() {
        return await this.request('/donations');
    },

    async createDonation(donationData) {
        return await this.request('/donations', {
            method: 'POST',
            body: JSON.stringify(donationData)
        });
    },

    async updateDonation(id, donationData) {
        return await this.request(`/donations/${id}`, {
            method: 'PUT',
            body: JSON.stringify(donationData)
        });
    },

    async deleteDonation(id) {
        return await this.request(`/donations/${id}`, {
            method: 'DELETE'
        });
    },

    // Gallery
    async getGallery() {
        return await this.request('/gallery');
    },

    async addGallery(imageData) {
        return await this.request('/gallery', {
            method: 'POST',
            body: JSON.stringify(imageData)
        });
    },

    async deleteGallery(id) {
        return await this.request(`/gallery/${id}`, {
            method: 'DELETE'
        });
    },

    // Certificates
    async getCertificates() {
        return await this.request('/certificates');
    },

    async getCertificate(id) {
        return await this.request(`/certificates/${id}`);
    },

    async createCertificate(certificateData) {
        return await this.request('/certificates', {
            method: 'POST',
            body: JSON.stringify(certificateData)
        });
    },

    async deleteCertificate(id) {
        return await this.request(`/certificates/${id}`, {
            method: 'DELETE'
        });
    },

    // Auth
    async login(username, password) {
        return await this.request('/auth/login', {
            method: 'POST',
            body: JSON.stringify({ username, password })
        });
    },

    async verifyAuth() {
        return await this.request('/auth/verify');
    },

    async changePassword(currentPassword, newPassword) {
        return await this.request('/auth/change-password', {
            method: 'POST',
            body: JSON.stringify({ currentPassword, newPassword })
        });
    },

    // Contact
    async submitContact(formData) {
        return await this.request('/contact', {
            method: 'POST',
            body: JSON.stringify(formData)
        });
    }
};

// ==================== LOCAL CACHE & SYNC HELPERS ====================
function getDonors() {
    return JSON.parse(localStorage.getItem('chavali_donors') || '[]');
}

function saveDonors(donors) {
    localStorage.setItem('chavali_donors', JSON.stringify(donors));
}

function getDonations() {
    return JSON.parse(localStorage.getItem('chavali_donations') || '[]');
}

function saveDonations(donations) {
    localStorage.setItem('chavali_donations', JSON.stringify(donations));
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
        console.warn('Storage full or unavailable');
    }
}

function saveCertificate(certificate) {
    const certificates = getCertificates();
    certificates.push(certificate);
    saveCertificates(certificates);
}

// Bengali digit conversion
function toBengali(num) {
    const bengaliDigits = ['০','১','২','৩','৪','৫','৬','৭','৮','৯'];
    return String(num).replace(/[0-9]/g, d => bengaliDigits[d]);
}

function normalizePhone(phone) {
    let digits = String(phone || '').replace(/\D/g, '');
    if (digits.startsWith('880') && digits.length >= 13) {
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

// ==================== HEADER & NAVIGATION ====================
const header = document.getElementById('header');
const hamburger = document.getElementById('hamburger');
const mainNav = document.getElementById('mainNav');
const mobileOverlay = document.getElementById('mobileOverlay');
const scrollTopBtn = document.getElementById('scrollTopBtn');

// Change header style while scrolling
window.addEventListener('scroll', debounce(() => {
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

document.querySelectorAll('.nav a').forEach(link => {
    link.addEventListener('click', closeMenu);
});

if (scrollTopBtn) {
    scrollTopBtn.addEventListener('click', () => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
    });
}

function debounce(func, delay) {
    let timeoutId;
    return function(...args) {
        clearTimeout(timeoutId);
        timeoutId = setTimeout(() => func(...args), delay);
    };
}

// ==================== DONOR FORM SUBMISSION (REGISTER.HTML) ====================
const donorForm = document.getElementById('donorForm');
const successMsg = document.getElementById('successMsg');

if (donorForm) {
    donorForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        const submitBtn = donorForm.querySelector('button[type="submit"]');
        const originalBtnText = submitBtn ? submitBtn.textContent : '';
        if (submitBtn) {
            submitBtn.disabled = true;
            submitBtn.textContent = 'তথ্য সংরক্ষণ করা হচ্ছে...';
        }

        const donor = {
            id: Date.now(),
            name: document.getElementById('name').value.trim(),
            mobile: document.getElementById('mobile').value.trim(),
            bloodGroup: document.getElementById('bloodGroup').value,
            address: document.getElementById('address').value.trim(),
            lastDonation: document.getElementById('lastDonation').value,
            registeredAt: new Date().toISOString()
        };

        // 1. Save to Neon database
        const apiRes = await API.createDonor(donor);

        // 2. Sync to local cache
        const donors = getDonors();
        donors.push(donor);
        saveDonors(donors);

        if (submitBtn) {
            submitBtn.disabled = false;
            submitBtn.textContent = originalBtnText;
        }

        // Show success message
        if (successMsg) {
            successMsg.classList.add('show');
        }
        donorForm.reset();

        // Update UI
        renderDonorList();
        updateStats();

        setTimeout(() => {
            if (successMsg) successMsg.classList.remove('show');
        }, 5000);
    });
}

// ==================== CONTACT FORM SUBMISSION ====================
const contactForm = document.getElementById('contactForm');
if (contactForm) {
    contactForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const name = document.getElementById('contactName')?.value;
        const phone = document.getElementById('contactPhone')?.value;
        const email = document.getElementById('contactEmail')?.value;
        const message = document.getElementById('contactMessage')?.value;

        const res = await API.submitContact({ name, phone, email, message });
        alert(res.message || 'ধন্যবাদ! আপনার বার্তা সফলভাবে পাঠানো হয়েছে।');
        contactForm.reset();
    });
}

// ==================== DONOR LIST RENDERING (DONORS.HTML) ====================
const donorGrid = document.getElementById('donorGrid');
const donorFilters = document.getElementById('donorFilters');
let currentFilter = 'all';

function getDonorProfileImage(donor) {
    if (!donor.mobile) return null;
    
    const donations = getDonations();
    const phoneKey = normalizePhone(donor.mobile);
    
    const donorDonations = donations
        .filter(d => normalizePhone(d.donorPhone) === phoneKey && d.image)
        .sort((a, b) => new Date(b.addedAt || b.date) - new Date(a.addedAt || a.date));
    
    return donorDonations.length > 0 ? donorDonations[0].image : null;
}

async function renderDonorList(filter = 'all') {
    if (!donorGrid) return;
    
    // Fetch live from Neon backend, fallback to local cache
    let donors = getDonors();
    const res = await API.getDonors(filter);
    if (res.ok && Array.isArray(res.data) && res.data.length > 0) {
        donors = res.data;
        saveDonors(donors); // update cache
    }
    
    let filtered = filter === 'all' ? donors : donors.filter(d => (d.bloodGroup || d.blood_group) === filter);
    
    filtered = filtered.sort((a, b) => {
        const dateA = (a.lastDonation || a.last_donation) ? new Date(a.lastDonation || a.last_donation) : new Date(0);
        const dateB = (b.lastDonation || b.last_donation) ? new Date(b.lastDonation || b.last_donation) : new Date(0);
        return dateB - dateA;
    });

    if (filtered.length === 0) {
        donorGrid.innerHTML = `
            <div class="no-donors" style="grid-column:1/-1; text-align:center; padding:40px; color:#666;">
                <div class="icon" style="font-size:3rem; margin-bottom:12px;">🩸</div>
                <p>${filter === 'all' ? 'এখনও কোন রক্তদাতা নিবন্ধিত হয়নি।' : filter + ' গ্রুপের কোন রক্তদাতা পাওয়া যায়নি।'}</p>
            </div>
        `;
        return;
    }

    donorGrid.innerHTML = filtered.map(donor => {
        const profileImage = getDonorProfileImage(donor);
        const blood = donor.bloodGroup || donor.blood_group;
        const lastDon = donor.lastDonation || donor.last_donation;
        
        return `
        <div class="donor-card">
            <div class="donor-card-header">
                <div class="donor-avatar">
                    ${profileImage ? 
                        `<img src="${profileImage}" alt="${donor.name}" style="width:100%; height:100%; object-fit:cover; border-radius:50%;">` : 
                        '<div style="width:100%; height:100%; display:flex; align-items:center; justify-content:center; background:#fee2e2; color:#dc2626; font-size:1.4rem; font-weight:700; border-radius:50%;">' + (donor.name ? donor.name.charAt(0) : 'CBF') + '</div>'
                    }
                </div>
                <div>
                    <div class="donor-name">${donor.name}</div>
                    <span class="donor-blood">${blood}</span>
                </div>
            </div>
            <div class="donor-info">
                <div class="donor-info-item">
                    <span class="icon">📍</span>
                    <span>${donor.address}</span>
                </div>
                <div class="donor-info-item">
                    <span class="icon">📞</span>
                    <a href="tel:${donor.mobile}" style="color:inherit; text-decoration:none;">${donor.mobile}</a>
                </div>
                ${lastDon ? `
                <div class="donor-info-item">
                    <span class="icon">🩸</span>
                    <span>শেষ রক্তদান: ${lastDon}</span>
                </div>
                ` : ''}
            </div>
        </div>
    `;}).join('');
}

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

// ==================== DONATION SLIDER (INDEX.HTML) ====================
let currentSlide = 0;
let donationSlides = [];
let donationSliderIntervalId = null;

async function renderDonationSlider() {
    const sliderContainer = document.getElementById('donationSlider');
    if (!sliderContainer) return;

    let donations = getDonations();
    const res = await API.getDonations();
    if (res.ok && Array.isArray(res.data) && res.data.length > 0) {
        donations = res.data;
        saveDonations(donations);
    }

    if (donations.length === 0) {
        sliderContainer.innerHTML = `
            <div style="padding:40px; text-align:center; color:#666; width:100%;">
                <p>কোন সাম্প্রতিক রক্তদানের রেকর্ড পাওয়া যায়নি</p>
            </div>
        `;
        return;
    }

    donationSlides = donations;
    sliderContainer.innerHTML = donations.map((d, index) => `
        <div class="donation-slide ${index === 0 ? 'is-active' : ''}" style="min-width:100%; flex-shrink:0; padding:20px; box-sizing:border-box;">
            <div class="donation-slide-card" style="background:#fff; border-radius:12px; padding:24px; box-shadow:0 4px 15px rgba(0,0,0,0.06); display:flex; flex-wrap:wrap; gap:20px; align-items:center;">
                ${d.image ? `
                    <div style="width:120px; height:120px; border-radius:10px; overflow:hidden; flex-shrink:0;">
                        <img src="${d.image}" alt="${d.donorName}" style="width:100%; height:100%; object-fit:cover;">
                    </div>
                ` : ''}
                <div style="flex:1; min-width:200px;">
                    <span style="display:inline-block; padding:4px 12px; background:#fee2e2; color:#dc2626; border-radius:20px; font-weight:700; font-size:0.9rem; margin-bottom:8px;">${d.bloodGroup}</span>
                    <h3 style="margin:0 0 6px 0; font-size:1.3rem; color:#1f2937;">${d.donorName}</h3>
                    <p style="margin:0 0 4px 0; color:#4b5563; font-size:0.95rem;">📍 ${d.donorAddress}</p>
                    <p style="margin:0 0 4px 0; color:#6b7280; font-size:0.9rem;">🗓️ তারিখ: ${d.date}</p>
                    <p style="margin:0; color:#9ca3af; font-size:0.85rem;">আইডি: ${d.number}</p>
                </div>
            </div>
        </div>
    `).join('');

    const indicatorsEl = document.getElementById('donationSliderIndicators');
    if (indicatorsEl) {
        indicatorsEl.innerHTML = donations.map((_, i) => `
            <button class="slider-indicator ${i === 0 ? 'active' : ''}" onclick="goToSlide(${i})" aria-label="Slide ${i+1}"></button>
        `).join('');
    }

    startSliderAutoPlay();
}

window.goToSlide = function(index) {
    currentSlide = index;
    updateSlider();
};

function updateSlider() {
    const sliderTrack = document.getElementById('donationSlider');
    if (!sliderTrack || donationSlides.length === 0) return;

    const offset = -currentSlide * 100;
    sliderTrack.style.transform = `translateX(${offset}%)`;
    sliderTrack.style.transition = 'transform 0.5s ease-in-out';

    const slides = sliderTrack.querySelectorAll('.donation-slide');
    slides.forEach((slide, index) => {
        slide.classList.toggle('is-active', index === currentSlide);
    });

    const indicatorsEl = document.getElementById('donationSliderIndicators');
    if (indicatorsEl) {
        const indicators = indicatorsEl.querySelectorAll('.slider-indicator');
        indicators.forEach((indicator, index) => {
            indicator.classList.toggle('active', index === currentSlide);
        });
    }
}

function startSliderAutoPlay() {
    if (donationSliderIntervalId) clearInterval(donationSliderIntervalId);
    if (donationSlides.length > 1) {
        donationSliderIntervalId = setInterval(() => {
            currentSlide = (currentSlide + 1) % donationSlides.length;
            updateSlider();
        }, 5000);
    }
}

const prevSlideBtn = document.getElementById('prevSlide');
const nextSlideBtn = document.getElementById('nextSlide');

if (prevSlideBtn) {
    prevSlideBtn.addEventListener('click', () => {
        if (donationSlides.length > 0) {
            currentSlide = (currentSlide - 1 + donationSlides.length) % donationSlides.length;
            updateSlider();
        }
    });
}

if (nextSlideBtn) {
    nextSlideBtn.addEventListener('click', () => {
        if (donationSlides.length > 0) {
            currentSlide = (currentSlide + 1) % donationSlides.length;
            updateSlider();
        }
    });
}

// ==================== GALLERY RENDERING (GALLERY.HTML) ====================
const galleryGrid = document.getElementById('galleryGrid');

async function renderGallery() {
    if (!galleryGrid) return;
    
    let gallery = getGalleryImages();
    const donorPhotos = getDonorPhotos();
    
    const res = await API.getGallery();
    if (res.ok && Array.isArray(res.data) && res.data.length > 0) {
        gallery = res.data;
        saveGalleryImages(gallery);
    }

    const allImages = [...gallery, ...donorPhotos];

    if (allImages.length === 0) {
        galleryGrid.innerHTML = `
            <div class="gallery-card"><div class="gallery-placeholder"></div><div class="caption">রক্তদান কর্মসূচি ২০২৬</div></div>
            <div class="gallery-card"><div class="gallery-placeholder"></div><div class="caption">স্বেচ্ছাসেবী রক্তদাতা সমাবেশ</div></div>
            <div class="gallery-card"><div class="gallery-placeholder"></div><div class="caption">সচেতনতামূলক কার্যক্রম</div></div>
            <div class="gallery-card"><div class="gallery-placeholder"></div><div class="caption">জরুরি রক্ত সহায়তা</div></div>
        `;
        return;
    }

    galleryGrid.innerHTML = allImages.map((img) => `
        <div class="gallery-card" onclick="openLightbox('${img.data || img.image_data || ''}')">
            <img src="${img.data || img.image_data || ''}" alt="${img.caption || 'Blood Donation Activity'}" loading="lazy">
            <div class="caption">${img.caption || 'রক্তদান কার্যক্রম'}</div>
        </div>
    `).join('');
}

// ==================== LIGHTBOX ====================
const lightbox = document.getElementById('lightbox');
const lightboxImg = document.getElementById('lightboxImg');
const lightboxClose = document.getElementById('lightboxClose');

window.openLightbox = function(src) {
    if (!lightbox || !lightboxImg || !src) return;
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
        if (e.target === lightbox) lightbox.classList.remove('active');
    });
}

// ==================== STATS COUNTER ====================
async function updateStats() {
    let donorsCount = getDonors().length;
    let donationsCount = getDonations().length;
    let certificatesCount = getCertificates().length;

    // Fetch live stats from Neon API
    const res = await API.getStats();
    if (res.ok && res.stats) {
        donorsCount = res.stats.totalDonors || donorsCount;
        donationsCount = res.stats.totalDonations || donationsCount;
        certificatesCount = res.stats.totalCertificates || certificatesCount;
    }

    const statDonors = document.getElementById('statDonors');
    if (statDonors) statDonors.textContent = toBengali(donorsCount);

    const adminStatDonors = document.getElementById('adminStatDonors');
    if (adminStatDonors) adminStatDonors.textContent = donorsCount;

    const adminDonationStat = document.getElementById('adminStatDonations');
    if (adminDonationStat) adminDonationStat.textContent = donationsCount;

    const adminCertificateStat = document.getElementById('adminStatCertificates');
    if (adminCertificateStat) adminCertificateStat.textContent = certificatesCount;
}

// ==================== ADMIN SYSTEM & NEON DB STATUS ====================
function isAdminLoggedIn() {
    return Boolean(API.getToken() || localStorage.getItem('chavali_admin_logged_in') === 'true');
}

function showLoginForm() {
    const adminLogin = document.getElementById('adminLogin');
    const adminDashboard = document.getElementById('adminDashboard');
    if (adminLogin) adminLogin.style.display = 'flex';
    if (adminDashboard) adminDashboard.style.display = 'none';
}

function showAdminDashboard() {
    const adminLogin = document.getElementById('adminLogin');
    const adminDashboard = document.getElementById('adminDashboard');
    if (adminLogin) adminLogin.style.display = 'none';
    if (adminDashboard) adminDashboard.style.display = 'block';
    
    // Check DB status on dashboard show
    updateDbStatusBadge();
}

async function updateDbStatusBadge() {
    const badge = document.getElementById('dbStatusPill');
    const badgeText = document.getElementById('dbStatusText');
    const statusDot = document.getElementById('dbStatusDot');
    if (!badge || !badgeText) return;

    const health = await API.checkHealth();
    if (health.ok && health.database && health.database.connected) {
        badge.style.background = '#f0fdf4';
        badge.style.borderColor = '#bbf7d0';
        badge.style.color = '#166534';
        if (statusDot) statusDot.style.background = '#22c55e';
        badgeText.textContent = `Neon DB: Connected (${health.database.latencyMs}ms)`;
    } else if (health.database && health.database.configured) {
        badge.style.background = '#fef2f2';
        badge.style.borderColor = '#fecaca';
        badge.style.color = '#991b1b';
        if (statusDot) statusDot.style.background = '#ef4444';
        badgeText.textContent = 'Neon DB: Connection Error';
    } else {
        badge.style.background = '#fffbeb';
        badge.style.borderColor = '#fde68a';
        badge.style.color = '#92400e';
        if (statusDot) statusDot.style.background = '#f59e0b';
        badgeText.textContent = 'Neon DB: Local Mode';
    }
}

// Admin Login Form
const adminLoginForm = document.getElementById('adminLoginForm');
if (adminLoginForm) {
    adminLoginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const username = document.getElementById('adminUsername')?.value.trim();
        const password = document.getElementById('adminPassword')?.value.trim();
        const loginMessage = document.getElementById('loginMessage');
        
        if (!username || !password) {
            if (loginMessage) {
                loginMessage.textContent = 'Please enter both username and password';
                loginMessage.style.display = 'block';
                loginMessage.style.background = '#fee2e2';
                loginMessage.style.color = '#991b1b';
            }
            return;
        }

        const res = await API.login(username, password);

        if (res.ok && res.token) {
            API.setToken(res.token);
            localStorage.setItem('chavali_admin_logged_in', 'true');

            if (loginMessage) {
                loginMessage.textContent = 'Login successful! Opening dashboard...';
                loginMessage.style.display = 'block';
                loginMessage.style.background = '#dcfce7';
                loginMessage.style.color = '#166534';
            }

            setTimeout(() => {
                showAdminDashboard();
                adminLoginForm.reset();
                renderAdminDonorTable();
                renderAdminDonationTable();
                renderAdminCertificateTable();
                updateStats();
                populateCertificateDonationSelect();
                if (loginMessage) loginMessage.style.display = 'none';
            }, 400);
        } else {
            // Local fallback check
            const storedUser = localStorage.getItem('chavali_admin_username') || 'admin';
            const storedPass = localStorage.getItem('chavali_admin_password') || 'admin123';

            if (username === storedUser && password === storedPass) {
                localStorage.setItem('chavali_admin_logged_in', 'true');
                showAdminDashboard();
                renderAdminDonorTable();
                renderAdminDonationTable();
                renderAdminCertificateTable();
                updateStats();
                populateCertificateDonationSelect();
            } else {
                if (loginMessage) {
                    loginMessage.textContent = res.message || 'Invalid username or password';
                    loginMessage.style.display = 'block';
                    loginMessage.style.background = '#fee2e2';
                    loginMessage.style.color = '#991b1b';
                }
            }
        }
    });
}

// Password toggle
const passwordToggle = document.getElementById('passwordToggle');
const passwordInput = document.getElementById('adminPassword');
if (passwordToggle && passwordInput) {
    passwordToggle.addEventListener('click', (e) => {
        e.preventDefault();
        const isPassword = passwordInput.type === 'password';
        passwordInput.type = isPassword ? 'text' : 'password';
        const eyeIcon = passwordToggle.querySelector('.eye-icon');
        if (eyeIcon) eyeIcon.textContent = isPassword ? '🙈' : '👁️';
    });
}

// Admin Logout
const adminLogoutBtn = document.getElementById('adminLogoutBtn');
if (adminLogoutBtn) {
    adminLogoutBtn.addEventListener('click', () => {
        if (confirm('Are you sure you want to logout?')) {
            API.setToken(null);
            localStorage.removeItem('chavali_admin_logged_in');
            window.location.href = '../index.html';
        }
    });
}

// Admin Tab Switching
const adminTabs = document.querySelectorAll('.admin-tab');
if (adminTabs.length > 0) {
    adminTabs.forEach(tab => {
        tab.addEventListener('click', () => {
            document.querySelectorAll('.admin-tab').forEach(t => t.classList.remove('active'));
            document.querySelectorAll('.admin-panel').forEach(p => p.classList.remove('active'));
            tab.classList.add('active');
            const target = document.getElementById(tab.dataset.tab);
            if (target) target.classList.add('active');
        });
    });
}

// ==================== ADMIN: DONOR TABLE ====================
async function renderAdminDonorTable() {
    const tbody = document.getElementById('adminDonorBody');
    if (!tbody) return;

    let donors = getDonors();
    const res = await API.getDonors('all');
    if (res.ok && Array.isArray(res.data)) {
        donors = res.data;
        saveDonors(donors);
    }

    if (donors.length === 0) {
        tbody.innerHTML = '<tr><td colspan="7" style="text-align:center; padding:30px; color:#999;">No donors registered yet</td></tr>';
        return;
    }

    tbody.innerHTML = donors.map((d, i) => `
        <tr>
            <td>${i + 1}</td>
            <td>${d.name}</td>
            <td>${d.mobile}</td>
            <td><span class="donor-blood">${d.bloodGroup || d.blood_group}</span></td>
            <td>${d.address}</td>
            <td>${d.lastDonation || d.last_donation || 'Not mentioned'}</td>
            <td><button class="delete-btn" onclick="deleteDonor(${d.id})">Delete</button></td>
        </tr>
    `).join('');
}

window.deleteDonor = async function(id) {
    if (confirm('Are you sure you want to delete this donor?')) {
        await API.deleteDonor(id);
        let donors = getDonors().filter(d => d.id !== id);
        saveDonors(donors);
        renderAdminDonorTable();
        renderDonorList(currentFilter);
        updateStats();
    }
};

// ==================== ADMIN: DONATION TABLE ====================
async function renderAdminDonationTable() {
    const tbody = document.getElementById('adminDonationBody');
    if (!tbody) return;

    let donations = getDonations();
    const res = await API.getDonations();
    if (res.ok && Array.isArray(res.data)) {
        donations = res.data;
        saveDonations(donations);
    }

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

    document.getElementById('addDonorName').value = donation.donorName || '';
    document.getElementById('addDonorPhone').value = donation.donorPhone || '';
    document.getElementById('addDonorAddress').value = donation.donorAddress || '';
    document.getElementById('addDonationNumber').value = donation.number;
    document.getElementById('addDonationBlood').value = donation.bloodGroup;
    document.getElementById('addDonationDate').value = donation.date;

    if (donation.image) {
        const preview = document.getElementById('donationImagePreview');
        if (preview) {
            preview.innerHTML = `
                <div style="display:flex; align-items:center; gap:12px; padding:12px; background:#f0f0f0; border-radius:8px;">
                    <img src="${donation.image}" style="width:80px; height:80px; object-fit:cover; border-radius:6px;">
                    <div>
                        <p style="margin:0; font-weight:500;">Current Image</p>
                        <p style="margin:4px 0 0 0; font-size:0.85rem; color:#666;">Upload new image to replace</p>
                    </div>
                </div>
            `;
        }
    }

    addDonationForm.editingId = id;
    const submitBtn = addDonationForm.querySelector('button[type="submit"]');
    if (submitBtn) submitBtn.textContent = 'Update Donation';

    const cancelBtn = document.getElementById('cancelDonationBtn');
    if (cancelBtn) cancelBtn.style.display = 'inline-block';

    document.querySelectorAll('.admin-tab').forEach(t => t.classList.remove('active'));
    document.querySelectorAll('.admin-panel').forEach(p => p.classList.remove('active'));
    const addTab = document.querySelector('[data-tab="adminAddDonation"]');
    if (addTab) addTab.classList.add('active');
    const addPanel = document.getElementById('adminAddDonation');
    if (addPanel) addPanel.classList.add('active');

    addPanel?.scrollIntoView({ behavior: 'smooth' });
};

window.deleteDonation = async function(id) {
    if (confirm('Are you sure you want to delete this donation record?')) {
        await API.deleteDonation(id);
        let donations = getDonations().filter(d => d.id !== id);
        saveDonations(donations);
        renderAdminDonationTable();
        updateStats();
    }
};

// ==================== ADMIN: ADD / EDIT DONATION FORM ====================
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
    if (bloodEl && !bloodEl.value) bloodEl.value = match.bloodGroup || match.blood_group || '';
}

if (addDonorPhoneInput) {
    addDonorPhoneInput.addEventListener('focus', renderDonorPhoneSuggestions);
    addDonorPhoneInput.addEventListener('click', renderDonorPhoneSuggestions);
    addDonorPhoneInput.addEventListener('input', (e) => {
        renderDonorPhoneSuggestions();
        fillDonationFormFromPhone(e.target.value);
    });
}

const donationImageUploadArea = document.getElementById('donationImageUploadArea');
if (donationImageUploadArea) {
    donationImageUploadArea.addEventListener('click', () => donationImageInput?.click());
}

if (donationImageInput) {
    donationImageInput.addEventListener('change', (e) => {
        if (e.target.files && e.target.files[0]) {
            handleDonationImageFile(e.target.files[0]);
        }
    });
}

function handleDonationImageFile(file) {
    if (file.size > 5 * 1024 * 1024) {
        showAddDonationMessage('File size must be less than 5MB!', 'error');
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
            if (addDonationForm) addDonationForm.donationImage = e.target.result;
        }
    };
    reader.readAsDataURL(file);
}

window.clearDonationImage = function() {
    if (donationImageInput) donationImageInput.value = '';
    const preview = document.getElementById('donationImagePreview');
    if (preview) preview.innerHTML = '';
    if (addDonationForm) addDonationForm.donationImage = null;
};

if (addDonationForm) {
    addDonationForm.addEventListener('submit', async (e) => {
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
        const donationPayload = {
            donorName,
            donorPhone,
            donorAddress,
            number: donationNumber,
            bloodGroup,
            date: donationDate,
            image: donationImage
        };

        if (isEditing) {
            await API.updateDonation(isEditing, donationPayload);
            let donations = getDonations();
            const idx = donations.findIndex(d => d.id === isEditing);
            if (idx !== -1) {
                donations[idx] = { ...donations[idx], ...donationPayload, updatedAt: new Date().toISOString() };
                saveDonations(donations);
            }
            showAddDonationMessage('Donation updated successfully!', 'success');
        } else {
            const apiRes = await API.createDonation(donationPayload);
            let donations = getDonations();
            const newRecord = {
                id: apiRes.data?.id || Date.now(),
                ...donationPayload,
                addedAt: new Date().toISOString()
            };
            donations.push(newRecord);
            saveDonations(donations);
            showAddDonationMessage('Donation recorded successfully in Neon DB!', 'success');
        }

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
        renderDonationSlider();
        renderDonorPhoneSuggestions();
    });
}

function resetDonationForm() {
    if (!addDonationForm) return;
    addDonationForm.reset();
    clearDonationImage();
    delete addDonationForm.editingId;
    
    const submitBtn = addDonationForm.querySelector('button[type="submit"]');
    if (submitBtn) submitBtn.textContent = 'Add Donation';
    
    const cancelBtn = document.getElementById('cancelDonationBtn');
    if (cancelBtn) cancelBtn.style.display = 'none';
}

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
        return;
    }
    
    messageEl.textContent = message;
    messageEl.style.display = 'block';
    messageEl.style.background = type === 'success' ? '#dcfce7' : '#fee2e2';
    messageEl.style.color = type === 'success' ? '#166534' : '#991b1b';
    messageEl.style.border = type === 'success' ? '1px solid #86efac' : '1px solid #fca5a5';
}

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

    const donationDate = new Date(donation.date);
    const donationDateLabel = isNaN(donationDate.getTime())
        ? (donation.date || '')
        : donationDate.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
    const issuedOnLabel = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
    const safeMessage = message ? String(message).trim() : '';

    const certificateHtml = `
        <style>
            @page { size: A4 landscape; margin: 0; }
            .cb-cert {
                position: relative;
                width: 842px;
                height: 595px;
                margin: 0 auto;
                font-family: 'Noto Sans Bengali', Arial, sans-serif;
                background: #fff;
                border: 12px double #dc2626;
                box-sizing: border-box;
                padding: 40px;
                display: flex;
                flex-direction: column;
                justify-content: space-between;
                text-align: center;
            }
            .cb-cert-title { font-size: 32px; font-weight: 800; color: #dc2626; margin: 0 0 4px 0; }
            .cb-cert-sub { font-size: 18px; color: #4b5563; margin: 0 0 20px 0; }
            .cb-cert-name { font-size: 26px; font-weight: 700; color: #111827; margin: 10px 0; }
            .cb-cert-details { font-size: 16px; color: #374151; margin: 12px 0; line-height: 1.8; }
            .cb-cert-message { font-size: 15px; color: #4b5563; margin: 12px auto; max-width: 600px; font-style: italic; }
            .cb-cert-footer { display: flex; justify-content: space-between; align-items: flex-end; margin-top: 20px; padding-top: 10px; border-top: 1px solid #e5e7eb; }
        </style>
        <div class="cb-cert">
            <div>
                <h1 class="cb-cert-title">চাঁভালি রক্ত ফাউন্ডেশন</h1>
                <p class="cb-cert-sub">রক্তদান সম্মাননা ও প্রশংসাপত্র</p>
                <p style="color:#6b7280; font-size:14px;">সনদ নম্বর: ${donation.number}</p>
            </div>
            <div>
                <p style="font-size:16px; color:#4b5563;">এই প্রশংসাপত্রটি সশ্রদ্ধ চিত্তে প্রদান করা হচ্ছে</p>
                <div class="cb-cert-name">${donation.donorName}</div>
                <div class="cb-cert-details">
                    <strong>রক্তের গ্রুপ:</strong> ${donation.bloodGroup} &nbsp;|&nbsp; 
                    <strong>রক্তদানের তারিখ:</strong> ${donationDateLabel} &nbsp;|&nbsp; 
                    <strong>ঠিকানা:</strong> ${donation.donorAddress}
                </div>
                ${safeMessage ? `<div class="cb-cert-message">${safeMessage}</div>` : ''}
            </div>
            <div class="cb-cert-footer">
                <div style="text-align:left;">
                    <div style="font-weight:700; color:#dc2626;">চাঁভালি রক্ত ফাউন্ডেশন</div>
                    <div style="font-size:13px; color:#6b7280;">রক্তের বন্ধনে, চাঁভালি সবখানে</div>
                </div>
                <div style="text-align:right;">
                    <div style="font-size:14px; color:#4b5563;">প্রদানের তারিখ: ${issuedOnLabel}</div>
                    <div style="margin-top:20px; border-top:1px solid #374151; font-size:12px; color:#6b7280; padding-top:2px;">অনুমোদিত স্বাক্ষর</div>
                </div>
            </div>
        </div>
    `;

    return certificateHtml;
}

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

        const certificateHtml = generateCertificate(donationId, message);
        if (certificateHtml) {
            const container = document.getElementById('certificateContainer');
            const preview = document.getElementById('certificatePreview');
            
            if (container && preview) {
                container.innerHTML = certificateHtml;
                preview.style.display = 'block';
                showCertificateMessage('Certificate generated successfully!', 'success');

                const donations = getDonations();
                const donation = donations.find(d => d.id === parseInt(donationId));
                
                if (donation) {
                    const certificateData = {
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

                    await API.createCertificate(certificateData);
                    saveCertificate({ id: Date.now(), ...certificateData });
                    renderAdminCertificateTable();
                    updateStats();
                }

                preview.scrollIntoView({ behavior: 'smooth' });
            }
        }
    });
}

function showCertificateMessage(message, type) {
    const messageEl = document.getElementById('certificateMessageDisplay');
    if (!messageEl) return;
    if (!message) { messageEl.style.display = 'none'; return; }
    messageEl.textContent = message;
    messageEl.style.display = 'block';
    messageEl.style.background = type === 'success' ? '#dcfce7' : '#fee2e2';
    messageEl.style.color = type === 'success' ? '#166534' : '#991b1b';
}

// Download & Print Certificate
function downloadCertificate() {
    const container = document.getElementById('certificateContainer');
    if (!container || typeof html2canvas === 'undefined') {
        alert('Please print the certificate or use browser print.');
        return;
    }
    html2canvas(container, { scale: 2, useCORS: true, backgroundColor: '#ffffff' }).then(canvas => {
        const link = document.createElement('a');
        link.download = 'chavali_blood_certificate.png';
        link.href = canvas.toDataURL('image/png');
        link.click();
    });
}

function printCertificate() {
    const container = document.getElementById('certificateContainer');
    if (!container) return;
    const printWindow = window.open('', '_blank');
    printWindow.document.write(`
        <html>
            <head>
                <title>Blood Donation Certificate</title>
                <style>
                    @page { size: A4 landscape; margin: 0; }
                    body { margin: 0; padding: 20px; font-family: 'Noto Sans Bengali', Arial, sans-serif; }
                </style>
            </head>
            <body>${container.innerHTML}</body>
        </html>
    `);
    printWindow.document.close();
    printWindow.print();
}

const downloadCertificateBtn = document.getElementById('downloadCertificateBtn');
if (downloadCertificateBtn) downloadCertificateBtn.addEventListener('click', downloadCertificate);

const printCertificateBtn = document.getElementById('printCertificateBtn');
if (printCertificateBtn) printCertificateBtn.addEventListener('click', printCertificate);

// ==================== ADMIN: CERTIFICATE TABLE ====================
async function renderAdminCertificateTable() {
    const tbody = document.getElementById('adminCertificateBody');
    if (!tbody) return;

    let certificates = getCertificates();
    const res = await API.getCertificates();
    if (res.ok && Array.isArray(res.data)) {
        certificates = res.data;
        saveCertificates(certificates);
    }

    if (certificates.length === 0) {
        tbody.innerHTML = '<tr><td colspan="6" style="text-align:center; padding:30px; color:#999;">No certificates generated yet</td></tr>';
        return;
    }

    tbody.innerHTML = certificates.map((cert, i) => `
        <tr>
            <td>${i + 1}</td>
            <td>${cert.donorName}</td>
            <td><span class="donor-blood">${cert.bloodGroup}</span></td>
            <td>${cert.donationDate}</td>
            <td>${new Date(cert.generatedAt).toLocaleDateString()}</td>
            <td>
                <button class="delete-btn" onclick="deleteCertificate(${cert.id})">Delete</button>
            </td>
        </tr>
    `).join('');
}

window.deleteCertificate = async function(id) {
    if (confirm('Are you sure you want to delete this certificate?')) {
        await API.deleteCertificate(id);
        let certificates = getCertificates().filter(c => c.id !== id);
        saveCertificates(certificates);
        renderAdminCertificateTable();
        updateStats();
    }
};

// ==================== ADMIN: CHANGE PASSWORD ====================
const changePasswordForm = document.getElementById('changePasswordForm');
if (changePasswordForm) {
    changePasswordForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const currentPassword = document.getElementById('currentPassword')?.value;
        const newPassword = document.getElementById('newPassword')?.value;
        const confirmPassword = document.getElementById('confirmPassword')?.value;
        const messageEl = document.getElementById('changePasswordMessage');

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

        const res = await API.changePassword(currentPassword, newPassword);

        if (res.ok) {
            localStorage.setItem('chavali_admin_password', newPassword);
            showPasswordMessage('Password changed successfully in Neon DB!', 'success', messageEl);
            changePasswordForm.reset();
        } else {
            showPasswordMessage(res.message || 'Failed to update password', 'error', messageEl);
        }
    });
}

function showPasswordMessage(message, type, messageEl) {
    if (!messageEl) return;
    messageEl.textContent = message;
    messageEl.style.display = 'block';
    messageEl.style.background = type === 'success' ? '#dcfce7' : '#fee2e2';
    messageEl.style.color = type === 'success' ? '#166534' : '#991b1b';
}

// Password toggle fields
[
    { toggleId: 'currentPasswordToggle', inputId: 'currentPassword' },
    { toggleId: 'newPasswordToggle', inputId: 'newPassword' },
    { toggleId: 'confirmPasswordToggle', inputId: 'confirmPassword' }
].forEach(field => {
    const toggle = document.getElementById(field.toggleId);
    const input = document.getElementById(field.inputId);
    if (toggle && input) {
        toggle.addEventListener('click', (e) => {
            e.preventDefault();
            const isPassword = input.type === 'password';
            input.type = isPassword ? 'text' : 'password';
            const eyeIcon = toggle.querySelector('.eye-icon');
            if (eyeIcon) eyeIcon.textContent = isPassword ? '🙈' : '👁️';
        });
    }
});

// ==================== INITIALIZATION ON PAGE LOAD ====================
document.addEventListener('DOMContentLoaded', () => {
    renderDonorList();
    renderGallery();
    renderDonationSlider();
    updateStats();

    const adminDashboard = document.getElementById('adminDashboard');
    const adminLogin = document.getElementById('adminLogin');
    if (adminDashboard || adminLogin) {
        if (isAdminLoggedIn()) {
            showAdminDashboard();
            renderAdminDonorTable();
            renderAdminDonationTable();
            renderAdminCertificateTable();
            populateCertificateDonationSelect();
        } else {
            showLoginForm();
        }
    }
});
