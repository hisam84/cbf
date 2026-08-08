// ==============================================================================
// Authentication & Security Utilities
// JWT token generation, verification, and bcrypt password hashing
// ==============================================================================

const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const JWT_SECRET = process.env.JWT_SECRET || 'chavali_blood_foundation_default_jwt_secret_2026';
const JWT_EXPIRES_IN = '7d';

/**
 * Hash a plain text password with bcrypt
 */
async function hashPassword(plainPassword) {
    const salt = await bcrypt.genSalt(10);
    return await bcrypt.hash(plainPassword, salt);
}

/**
 * Verify a plain password against a bcrypt hash
 */
async function comparePassword(plainPassword, hashedPassword) {
    return await bcrypt.compare(plainPassword, hashedPassword);
}

/**
 * Generate a signed JWT token for an admin user
 */
function generateToken(payload) {
    return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
}

/**
 * Verify and decode a JWT token
 */
function verifyToken(token) {
    try {
        return jwt.verify(token, JWT_SECRET);
    } catch (err) {
        return null;
    }
}

/**
 * Express middleware to enforce admin authentication
 */
function requireAdminAuth(req, res, next) {
    const authHeader = req.headers.authorization || req.headers.Authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({
            success: false,
            message: 'Access denied. Missing or invalid Authorization header (Bearer token required).'
        });
    }

    const token = authHeader.split(' ')[1];
    const decoded = verifyToken(token);

    if (!decoded) {
        return res.status(401).json({
            success: false,
            message: 'Invalid or expired session token. Please log in again.'
        });
    }

    req.admin = decoded;
    next();
}

module.exports = {
    hashPassword,
    comparePassword,
    generateToken,
    verifyToken,
    requireAdminAuth
};
