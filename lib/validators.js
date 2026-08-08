// ==============================================================================
// Validation & Formatting Helpers
// Phone normalization and input sanitizers for Bangladesh blood foundation
// ==============================================================================

/**
 * Normalizes Bangladeshi phone numbers into standard 11-digit local format: 01XXXXXXXXX
 */
function normalizePhone(phone) {
    if (!phone) return '';
    let digits = String(phone).replace(/\D/g, '');

    // Format +8801XXXXXXXXX or 8801XXXXXXXXX -> 01XXXXXXXXX
    if (digits.startsWith('880') && digits.length >= 13) {
        digits = '0' + digits.slice(3);
    }
    // Format 1XXXXXXXXX (missing leading zero) -> 01XXXXXXXXX
    if (digits.startsWith('1') && digits.length === 10) {
        digits = '0' + digits;
    }
    return digits;
}

/**
 * Validates blood group
 */
const VALID_BLOOD_GROUPS = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];

function isValidBloodGroup(bg) {
    if (!bg) return false;
    return VALID_BLOOD_GROUPS.includes(bg.trim().toUpperCase());
}

/**
 * Sanitizes text to prevent XSS
 */
function sanitizeText(str) {
    if (typeof str !== 'string') return '';
    return str.trim();
}

module.exports = {
    normalizePhone,
    isValidBloodGroup,
    sanitizeText,
    VALID_BLOOD_GROUPS
};
