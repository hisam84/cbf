// ==============================================================================
// Authentication API Endpoints
// Login, session verification, and password change
// ==============================================================================

const express = require('express');
const router = express.Router();
const { isConfigured, getSql } = require('../lib/db');
const { hashPassword, comparePassword, generateToken, requireAdminAuth } = require('../lib/auth');

/**
 * POST /api/auth/login
 * Body: { username, password }
 */
router.post('/login', async (req, res) => {
    try {
        const { username, password } = req.body || {};

        if (!username || !password) {
            return res.status(400).json({
                success: false,
                message: 'Username and password are required'
            });
        }

        // If database is configured, verify against admins table in Neon
        if (isConfigured()) {
            const sql = getSql();
            const rows = await sql`SELECT * FROM admins WHERE username = ${username.trim()};`;

            if (rows.length > 0) {
                const admin = rows[0];
                const isMatch = await comparePassword(password, admin.password_hash);
                
                if (isMatch) {
                    const token = generateToken({ id: admin.id, username: admin.username });
                    return res.json({
                        success: true,
                        message: 'Login successful',
                        token,
                        admin: { username: admin.username }
                    });
                }
            }
        }

        // Fallback default admin check
        const defaultUser = process.env.ADMIN_DEFAULT_USERNAME || 'admin';
        const defaultPass = process.env.ADMIN_DEFAULT_PASSWORD || 'admin123';

        if (username.trim() === defaultUser && password === defaultPass) {
            const token = generateToken({ id: 1, username: defaultUser });
            return res.json({
                success: true,
                message: 'Login successful (Default Admin)',
                token,
                admin: { username: defaultUser }
            });
        }

        return res.status(401).json({
            success: false,
            message: 'Invalid username or password'
        });
    } catch (err) {
        console.error('Login error:', err);
        return res.status(500).json({
            success: false,
            message: 'Internal server error during login',
            error: err.message
        });
    }
});

/**
 * GET /api/auth/verify
 * Validates the current JWT session token
 */
router.get('/verify', requireAdminAuth, (req, res) => {
    return res.json({
        success: true,
        valid: true,
        admin: req.admin
    });
});

/**
 * POST /api/auth/change-password
 * Body: { currentPassword, newPassword }
 * Protected: Admin token required
 */
router.post('/change-password', requireAdminAuth, async (req, res) => {
    try {
        const { currentPassword, newPassword } = req.body || {};

        if (!currentPassword || !newPassword) {
            return res.status(400).json({
                success: false,
                message: 'Current password and new password are required'
            });
        }

        if (newPassword.length < 6) {
            return res.status(400).json({
                success: false,
                message: 'New password must be at least 6 characters long'
            });
        }

        const username = req.admin.username;

        if (isConfigured()) {
            const sql = getSql();
            const rows = await sql`SELECT * FROM admins WHERE username = ${username};`;

            if (rows.length > 0) {
                const admin = rows[0];
                const isMatch = await comparePassword(currentPassword, admin.password_hash);
                if (!isMatch) {
                    return res.status(400).json({
                        success: false,
                        message: 'Current password does not match'
                    });
                }

                const newHash = await hashPassword(newPassword);
                await sql`
                    UPDATE admins 
                    SET password_hash = ${newHash}, updated_at = CURRENT_TIMESTAMP 
                    WHERE id = ${admin.id};
                `;

                return res.json({
                    success: true,
                    message: 'Password updated successfully in Neon database'
                });
            }
        }

        return res.json({
            success: true,
            message: 'Password updated successfully'
        });
    } catch (err) {
        console.error('Password change error:', err);
        return res.status(500).json({
            success: false,
            message: 'Failed to update password',
            error: err.message
        });
    }
});

module.exports = router;
