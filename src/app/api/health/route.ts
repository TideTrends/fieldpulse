import { NextResponse } from 'next/server';
import { query } from '@/lib/db';

export const dynamic = 'force-dynamic';

/**
 * GET /api/health — Health check + DB connectivity test
 */
export async function GET() {
    try {
        const result = await query<{ now: Date }>('SELECT NOW() as now');
        return NextResponse.json({
            status: 'ok',
            database: 'connected',
            timestamp: result[0]?.now,
            version: '2.0.0',
        });
    } catch (error) {
        return NextResponse.json({
            status: 'error',
            database: 'disconnected',
            error: error instanceof Error ? error.message : 'Unknown error',
        }, { status: 503 });
    }
}
