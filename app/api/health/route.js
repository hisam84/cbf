import { NextResponse } from 'next/server';
import { checkDbConnection } from '@/lib/db';

export async function GET() {
    try {
        const dbStatus = await checkDbConnection();

        const responsePayload = {
            status: dbStatus.connected ? 'healthy' : (dbStatus.configured ? 'degraded' : 'unconfigured'),
            service: 'Chavali Blood Foundation Next.js Backend',
            database: {
                provider: 'Neon Serverless PostgreSQL',
                ...dbStatus
            },
            serverTime: new Date().toISOString(),
            uptimeSeconds: Math.floor(process.uptime()),
            nodeVersion: process.version
        };

        const statusCode = dbStatus.connected ? 200 : (dbStatus.configured ? 503 : 200);
        return NextResponse.json(responsePayload, { status: statusCode });
    } catch (err) {
        return NextResponse.json({
            status: 'error',
            error: err.message
        }, { status: 500 });
    }
}
