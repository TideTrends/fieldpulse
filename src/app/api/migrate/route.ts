import { NextResponse } from 'next/server';
import { runMigrations } from '@/lib/migrations';

export async function POST() {
    try {
        await runMigrations();
        return NextResponse.json({ success: true, message: 'Migrations complete' });
    } catch (error) {
        console.error('[migrate] Error:', error);
        return NextResponse.json(
            { success: false, message: error instanceof Error ? error.message : 'Migration failed' },
            { status: 500 }
        );
    }
}

export async function GET() {
    return NextResponse.json({ info: 'POST to run migrations' });
}
