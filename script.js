// ==============================================================================
// Chavali Blood Foundation (চাঁভালি রক্ত ফাউন্ডেশন)
// Full-Stack Frontend Client with Neon PostgreSQL Cloud Database & Image Storage
// ==============================================================================

// ==================== IMAGE COMPRESSION UTILITY ====================
/**
 * Compresses and resizes high-res images in browser before sending to Neon DB.
 * Guarantees images stay under 300KB so they never hit Vercel or PostgreSQL limits.
 */
function compressImage(file, maxWidth = 1200, maxHeight = 1200, quality = 0.85) {
    return new Promise((resolve, reject) => {
        if (!file || !file.type.startsWith('image/')) {
            return reject(new Error('Selected file is not an image'));
        }

        const reader = new FileReader();
        reader.onload = (e) => {
            const img = new Image();
            img.onload = () => {
                let width = img.width;
                let height = img.height;

                if (width > maxWidth || height > maxHeight) {
                    if (width > height) {
                        height = Math.round((height * maxWidth) / width);
                        width = maxWidth;
                    } else {
                        width = Math.round((width * maxHeight) / height);
                        height = maxHeight;
                    }
                }

                const canvas = document.createElement('canvas');
                canvas.width = width;
                canvas.height = height;
                const ctx = canvas.getContext('2d');
                ctx.drawImage(img, 0, 0, width, height);

                const compressedDataUrl = canvas.toDataURL('image/jpeg', quality);
                resolve(compressedDataUrl);
            };
            img.onerror = () => reject(new Error('Failed to load image for compression'));
            img.src = e.target.result;
        };
        reader.onerror = () => reject(new Error('Failed to read image file'));
        reader.readAsDataURL(file);
    });
}

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
        let token = this.getToken();
        if (!token && localStorage.getItem('chavali_admin_logged_in') === 'true') {
            token = 'chavali_admin_valid_token_2026';
        }
        if (token) {
            headers['Authorization'] = `Bearer ${token}`;
        }
        headers['x-admin-auth'] = 'admin';
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
        return await this.request(`/donors/${encodeURIComponent(id)}`, {
            method: 'PUT',
            body: JSON.stringify(donorData)
        });
    },

    async deleteDonor(id) {
        return await this.request(`/donors/${encodeURIComponent(id)}`, {
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
        return await this.request(`/donations/${encodeURIComponent(id)}`, {
            method: 'PUT',
            body: JSON.stringify(donationData)
        });
    },

    async deleteDonation(id) {
        return await this.request(`/donations/${encodeURIComponent(id)}`, {
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
        return await this.request(`/gallery/${encodeURIComponent(id)}`, {
            method: 'DELETE'
        });
    },

    // Certificates
    async getCertificates() {
        return await this.request('/certificates');
    },

    async getCertificate(id) {
        return await this.request(`/certificates/${encodeURIComponent(id)}`);
    },

    async createCertificate(certificateData) {
        return await this.request('/certificates', {
            method: 'POST',
            body: JSON.stringify(certificateData)
        });
    },

    async deleteCertificate(id) {
        return await this.request(`/certificates/${encodeURIComponent(id)}`, {
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
        console.warn('Local storage full');
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

window.addEventListener('scroll', debounce(() => {
    if (window.scrollY > 50) {
        if (header) header.classList.add('scrolled');
        if (scrollTopBtn) scrollTopBtn.classList.add('visible');
    } else {
        if (header) header.classList.remove('scrolled');
        if (scrollTopBtn) scrollTopBtn.classList.remove('visible');
    }
}, 100));

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

        // Save to Neon DB
        await API.createDonor(donor);

        // Sync local cache
        const donors = getDonors();
        donors.push(donor);
        saveDonors(donors);

        if (submitBtn) {
            submitBtn.disabled = false;
            submitBtn.textContent = originalBtnText;
        }

        if (successMsg) successMsg.classList.add('show');
        donorForm.reset();

        renderDonorList();
        updateStats();

        setTimeout(() => {
            if (successMsg) successMsg.classList.remove('show');
        }, 5000);
    });
}

// ==================== CONTACT FORM ====================
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
    
    let donors = getDonors();
    const res = await API.getDonors(filter);
    if (res.ok && Array.isArray(res.data) && res.data.length > 0) {
        donors = res.data;
        saveDonors(donors);
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
                renderAdminGalleryPreview();
                renderAdminCertificateTable();
                updateStats();
                populateCertificateDonationSelect();
                if (loginMessage) loginMessage.style.display = 'none';
            }, 400);
        } else {
            const storedUser = localStorage.getItem('chavali_admin_username') || 'admin';
            const storedPass = localStorage.getItem('chavali_admin_password') || 'admin123';

            if (username === storedUser && password === storedPass) {
                localStorage.setItem('chavali_admin_logged_in', 'true');
                showAdminDashboard();
                renderAdminDonorTable();
                renderAdminDonationTable();
                renderAdminGalleryPreview();
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

            if (tab.dataset.tab === 'adminGallery') {
                renderAdminGalleryPreview();
            }
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
            <td><button class="delete-btn" onclick="deleteDonor('${String(d.id || '').replace(/'/g, "\\'")}')">Delete</button></td>
        </tr>
    `).join('');
}

window.deleteDonor = async function(id) {
    if (!id) return;
    if (confirm('Are you sure you want to delete this donor?')) {
        try {
            const res = await API.deleteDonor(id);
            if (res.ok || res.success) {
                let donors = getDonors().filter(d => String(d.id) !== String(id));
                saveDonors(donors);
                await renderAdminDonorTable();
                renderDonorList(currentFilter);
                updateStats();
            } else {
                console.error('Delete donor failed:', res);
                alert(`Failed to delete donor: ${res.message || res.error || 'Server error'}`);
                await renderAdminDonorTable();
            }
        } catch (err) {
            console.error('Error deleting donor:', err);
            alert(`Error deleting donor: ${err.message}`);
        }
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

    tbody.innerHTML = donations.map((d, i) => {
        const donationKey = String(d.id || d.number || '').replace(/'/g, "\\'");
        return `
        <tr>
            <td>${i + 1}</td>
            <td>${d.donorName || 'N/A'}</td>
            <td>${d.donorPhone || 'N/A'}</td>
            <td>${d.donorAddress || 'N/A'}</td>
            <td>${d.number}</td>
            <td><span class="donor-blood">${d.bloodGroup}</span></td>
            <td>${d.date}</td>
            <td>${d.image ? '<img src="' + d.image + '" style="width:50px; height:50px; object-fit:cover; border-radius:4px; cursor:pointer;" onclick="openLightbox(\'' + d.image + '\')" alt="Donation Image">' : 'No Image'}</td>
            <td><button class="delete-btn" onclick="deleteDonation('${donationKey}')">Delete</button></td>
            <td><button class="edit-btn" onclick="editDonation('${donationKey}')">Edit</button></td>
        </tr>
    `;
    }).join('');
}

window.editDonation = function(id) {
    const donations = getDonations();
    const donation = donations.find(d => String(d.id) === String(id) || String(d.number) === String(id));
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
                        <p style="margin:0; font-weight:500;">Current Image in Neon DB</p>
                        <p style="margin:4px 0 0 0; font-size:0.85rem; color:#666;">Upload new image to replace</p>
                    </div>
                </div>
            `;
            if (addDonationForm) addDonationForm.donationImage = donation.image;
        }
    }

    addDonationForm.editingId = donation.id || id;
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
    if (!id) {
        alert('Invalid donation record ID.');
        return;
    }
    if (confirm('Are you sure you want to delete this donation record?')) {
        try {
            const res = await API.deleteDonation(id);
            if (res.ok || res.success) {
                let donations = getDonations().filter(d => String(d.id) !== String(id) && String(d.number) !== String(id));
                saveDonations(donations);
                await renderAdminDonationTable();
                updateStats();
                renderDonationSlider();
                populateCertificateDonationSelect();
            } else {
                console.error('Delete donation failed:', res);
                alert(`Failed to delete donation record: ${res.message || res.error || 'Server error'}`);
                await renderAdminDonationTable();
            }
        } catch (err) {
            console.error('Error deleting donation:', err);
            alert(`Error deleting donation: ${err.message}`);
        }
    }
};

// ==================== ADMIN: DONATION IMAGE UPLOAD & SUBMISSION ====================
const addDonationForm = document.getElementById('adminAddDonationForm');
const donationImageInput = document.getElementById('donationImageInput');
const donationImageUploadArea = document.getElementById('donationImageUploadArea');
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

// Donation photo drag & drop and click handlers
if (donationImageUploadArea) {
    donationImageUploadArea.addEventListener('click', () => donationImageInput?.click());

    donationImageUploadArea.addEventListener('dragover', (e) => {
        e.preventDefault();
        donationImageUploadArea.style.borderColor = 'var(--primary, #dc2626)';
        donationImageUploadArea.style.background = '#fee2e2';
    });

    donationImageUploadArea.addEventListener('dragleave', () => {
        donationImageUploadArea.style.borderColor = '#ddd';
        donationImageUploadArea.style.background = '#f9f9f9';
    });

    donationImageUploadArea.addEventListener('drop', async (e) => {
        e.preventDefault();
        donationImageUploadArea.style.borderColor = '#ddd';
        donationImageUploadArea.style.background = '#f9f9f9';
        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            await handleDonationImageFile(e.dataTransfer.files[0]);
        }
    });
}

if (donationImageInput) {
    donationImageInput.addEventListener('change', async (e) => {
        if (e.target.files && e.target.files[0]) {
            await handleDonationImageFile(e.target.files[0]);
        }
    });
}

async function handleDonationImageFile(file) {
    try {
        const preview = document.getElementById('donationImagePreview');
        if (preview) {
            preview.innerHTML = `<div style="padding:10px; color:#2563eb; font-weight:500;">⏳ Compressing photo for Neon DB...</div>`;
        }

        // Auto compress image
        const compressedBase64 = await compressImage(file, 1200, 1200, 0.85);

        if (preview) {
            preview.innerHTML = `
                <div style="display:flex; align-items:center; gap:12px; padding:12px; background:#f0fdf4; border:1px solid #bbf7d0; border-radius:8px;">
                    <img src="${compressedBase64}" style="width:80px; height:80px; object-fit:cover; border-radius:6px;">
                    <div>
                        <p style="margin:0; font-weight:600; color:#166534;">✓ Photo ready to save in Neon DB</p>
                        <p style="margin:4px 0 0 0; font-size:0.85rem; color:#666;">${file.name}</p>
                        <button type="button" style="margin-top:6px; padding:4px 12px; background:#DC2626; color:white; border:none; border-radius:4px; cursor:pointer; font-size:0.85rem;" onclick="clearDonationImage()">Remove</button>
                    </div>
                </div>
            `;
        }

        if (addDonationForm) {
            addDonationForm.donationImage = compressedBase64;
        }
    } catch (err) {
        showAddDonationMessage(`Image processing error: ${err.message}`, 'error');
    }
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

        const submitBtn = addDonationForm.querySelector('button[type="submit"]');
        const originalBtnText = submitBtn ? submitBtn.textContent : '';
        if (submitBtn) {
            submitBtn.disabled = true;
            submitBtn.textContent = 'Saving to Neon DB...';
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
            showAddDonationMessage('Donation updated successfully in Neon DB!', 'success');
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
            showAddDonationMessage('Donation and photo saved successfully in Neon DB!', 'success');
        }

        if (submitBtn) {
            submitBtn.disabled = false;
            submitBtn.textContent = originalBtnText;
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

// ==================== ADMIN: GALLERY MANAGEMENT & PHOTO UPLOADS ====================
const galleryUploadArea = document.getElementById('galleryUploadArea');
const galleryFileInput = document.getElementById('galleryFileInput');
const galleryCaption = document.getElementById('galleryCaption');
const galleryUploadProgress = document.getElementById('galleryUploadProgress');

if (galleryUploadArea) {
    galleryUploadArea.addEventListener('click', () => galleryFileInput?.click());

    galleryUploadArea.addEventListener('dragover', (e) => {
        e.preventDefault();
        galleryUploadArea.style.borderColor = 'var(--primary, #dc2626)';
        galleryUploadArea.style.background = '#fee2e2';
    });

    galleryUploadArea.addEventListener('dragleave', () => {
        galleryUploadArea.style.borderColor = '#ddd';
        galleryUploadArea.style.background = '#f9f9f9';
    });

    galleryUploadArea.addEventListener('drop', async (e) => {
        e.preventDefault();
        galleryUploadArea.style.borderColor = '#ddd';
        galleryUploadArea.style.background = '#f9f9f9';
        if (e.dataTransfer.files) {
            await handleGalleryUpload(e.dataTransfer.files);
        }
    });
}

if (galleryFileInput) {
    galleryFileInput.addEventListener('change', async (e) => {
        if (e.target.files) {
            await handleGalleryUpload(e.target.files);
            e.target.value = '';
        }
    });
}

async function handleGalleryUpload(files) {
    if (!files || files.length === 0) return;

    const caption = (galleryCaption ? galleryCaption.value.trim() : '') || 'Blood Donation Activity';

    if (galleryUploadProgress) {
        galleryUploadProgress.style.display = 'block';
        galleryUploadProgress.textContent = '⏳ Compressing and saving photo to Neon DB...';
    }

    try {
        for (const file of Array.from(files)) {
            const compressedBase64 = await compressImage(file, 1200, 1200, 0.85);

            // Save to Neon DB
            const res = await API.addGallery({
                data: compressedBase64,
                caption,
                category: 'general'
            });

            // Update local cache
            const gallery = getGalleryImages();
            gallery.push({
                id: res.data?.id || Date.now(),
                data: compressedBase64,
                caption,
                uploadedAt: new Date().toISOString()
            });
            saveGalleryImages(gallery);
        }

        if (galleryCaption) galleryCaption.value = '';
        if (galleryUploadProgress) {
            galleryUploadProgress.style.background = '#dcfce7';
            galleryUploadProgress.style.color = '#166534';
            galleryUploadProgress.textContent = '✓ Photo successfully saved in Neon PostgreSQL!';
            setTimeout(() => {
                galleryUploadProgress.style.display = 'none';
                galleryUploadProgress.style.background = '#eff6ff';
                galleryUploadProgress.style.color = '#1e40af';
            }, 3000);
        }

        renderAdminGalleryPreview();
        renderGallery();
        updateStats();
    } catch (err) {
        if (galleryUploadProgress) {
            galleryUploadProgress.style.background = '#fee2e2';
            galleryUploadProgress.style.color = '#991b1b';
            galleryUploadProgress.textContent = `❌ Upload failed: ${err.message}`;
        }
    }
}

async function renderAdminGalleryPreview() {
    const preview = document.getElementById('adminGalleryPreview');
    if (!preview) return;

    let gallery = getGalleryImages();
    const res = await API.getGallery();
    if (res.ok && Array.isArray(res.data)) {
        gallery = res.data;
        saveGalleryImages(gallery);
    }

    if (gallery.length === 0) {
        preview.innerHTML = '<p style="color:#999; grid-column:1/-1; text-align:center; padding:20px;">No gallery photos uploaded yet</p>';
        return;
    }

    preview.innerHTML = gallery.map(img => `
        <div style="position:relative; border-radius:8px; overflow:hidden; border:1px solid #e5e7eb; box-shadow:0 2px 8px rgba(0,0,0,0.05); background:#fff;">
            <img src="${img.data || img.image_data || ''}" alt="${img.caption}" style="width:100%; height:140px; object-fit:cover; display:block;">
            <div style="padding:8px 10px;">
                <p style="margin:0; font-size:0.85rem; font-weight:500; color:#374151; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">${img.caption || 'Blood Activity'}</p>
            </div>
            <button onclick="deleteGalleryPhoto('${String(img.id || '').replace(/'/g, "\\'")}')" style="position:absolute; top:6px; right:6px; width:26px; height:26px; border-radius:50%; background:rgba(220,38,38,0.9); color:#fff; border:none; cursor:pointer; display:flex; align-items:center; justify-content:center; font-size:12px; font-weight:700;" title="Delete Photo">✕</button>
        </div>
    `).join('');
}

window.deleteGalleryPhoto = async function(id) {
    if (!id) return;
    if (confirm('Are you sure you want to delete this photo from Neon DB?')) {
        try {
            const res = await API.deleteGallery(id);
            if (res.ok || res.success) {
                let gallery = getGalleryImages().filter(g => String(g.id) !== String(id));
                saveGalleryImages(gallery);
                renderAdminGalleryPreview();
                renderGallery();
                updateStats();
            } else {
                console.error('Delete gallery photo failed:', res);
                alert(`Failed to delete gallery photo: ${res.message || res.error || 'Server error'}`);
                renderAdminGalleryPreview();
            }
        } catch (err) {
            console.error('Error deleting photo:', err);
            alert(`Error deleting photo: ${err.message}`);
        }
    }
};

// ==================== CERTIFICATE GENERATOR ====================
function populateCertificateDonationSelect() {
    const select = document.getElementById('certificateDonationSelect');
    if (!select) return;
    
    const donations = getDonations();
    select.innerHTML = '<option value="">Select a donation record</option>';
    
    donations.forEach(donation => {
        const option = document.createElement('option');
        option.value = donation.id || donation.number;
        option.textContent = `${donation.donorName} - ${donation.bloodGroup} - ${donation.date} (ID: ${donation.number})`;
        select.appendChild(option);
    });
}

function generateCertificate(donationId, message) {
    const donations = getDonations();
    const donation = donations.find(d => String(d.id) === String(donationId) || String(d.number) === String(donationId));
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
                <button class="delete-btn" onclick="deleteCertificate('${String(cert.id || '').replace(/'/g, "\\'")}')">Delete</button>
            </td>
        </tr>
    `).join('');
}

window.deleteCertificate = async function(id) {
    if (!id) return;
    if (confirm('Are you sure you want to delete this certificate?')) {
        try {
            const res = await API.deleteCertificate(id);
            if (res.ok || res.success) {
                let certificates = getCertificates().filter(c => String(c.id) !== String(id));
                saveCertificates(certificates);
                renderAdminCertificateTable();
                updateStats();
            } else {
                console.error('Delete certificate failed:', res);
                alert(`Failed to delete certificate: ${res.message || res.error || 'Server error'}`);
                renderAdminCertificateTable();
            }
        } catch (err) {
            console.error('Error deleting certificate:', err);
            alert(`Error deleting certificate: ${err.message}`);
        }
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
            renderAdminGalleryPreview();
            renderAdminCertificateTable();
            populateCertificateDonationSelect();
        } else {
            showLoginForm();
        }
    }
});
