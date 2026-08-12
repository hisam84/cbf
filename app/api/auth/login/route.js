import { NextResponse } from 'next/server';
import { isConfigured, getSql, ensureTablesExist } from '@/lib/db';
import { comparePassword, generateToken } from '@/lib/auth';

export async function POST(req) {
    try {
        await ensureTablesExist();
        const body = await req.json().catch(() => ({}));
        const { username, password } = body;

        if (!username || !password) {
            return NextResponse.json({
                success: false,
                message: 'Username and password are required'
            }, { status: 400 });
        }

        if (isConfigured()) {
            const sql = getSql();
            const rows = await sql`SELECT * FROM admins WHERE username = ${username.trim()};`;

            if (rows.length > 0) {
                const admin = rows[0];
                const isMatch = await comparePassword(password, admin.password_hash);
                
                if (isMatch) {
                    const token = generateToken({ id: admin.id, username: admin.username });
                    return NextResponse.json({
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
            return NextResponse.json({
                success: true,
                message: 'Login successful (Default Admin)',
                token,
                admin: { username: defaultUser }
            });
        }

        return NextResponse.json({
            success: false,
            message: 'Invalid username or password'
        }, { status: 401 });
    } catch (err) {
        console.error('Login error:', err);
        return NextResponse.json({
            success: false,
            message: 'Internal server error during login',
            error: err.message
        }, { status: 500 });
    }
}
