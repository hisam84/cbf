import { NextResponse } from 'next/server';
import { checkDbConnection } from '@/lib/db';
import { ApiResponse, DbStatus } from '@/lib/types';

export async function GET(): Promise<NextResponse<ApiResponse>> {
  try {
    const dbStatus: DbStatus = await checkDbConnection();

    return NextResponse.json({
      success: true,
      database: dbStatus,
    });
  } catch (err: any) {
    return NextResponse.json(
      {
        success: false,
        message: 'Health check failed',
        error: err?.message || 'Unknown error',
        database: {
          connected: false,
          configured: false,
          message: err?.message || 'Error executing health check',
        },
      },
      { status: 500 }
    );
  }
}
