import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';

export const dynamic = 'force-dynamic';

// === Table ↔ type mapping for CRUD ===
const TABLE_MAP: Record<string, { table: string; columns: Record<string, string> }> = {
    timeEntries: {
        table: 'fp_time_entries',
        columns: {
            id: 'id', startTime: 'start_time', endTime: 'end_time',
            breakMinutes: 'break_minutes', notes: 'notes', tags: 'tags',
            date: 'date', isOvertime: 'is_overtime', hourlyRate: 'hourly_rate',
        },
    },
    mileageEntries: {
        table: 'fp_mileage_entries',
        columns: {
            id: 'id', date: 'date', startMileage: 'start_mileage',
            endMileage: 'end_mileage', tripMiles: 'trip_miles',
            startLocation: 'start_location', endLocation: 'end_location',
            notes: 'notes', linkedTimeEntryId: 'linked_time_entry_id',
            purpose: 'purpose',
        },
    },
    fuelLogs: {
        table: 'fp_fuel_logs',
        columns: {
            id: 'id', date: 'date', time: 'time', mileage: 'mileage',
            gallons: 'gallons', costPerGallon: 'cost_per_gallon',
            totalCost: 'total_cost', station: 'station', notes: 'notes',
            receiptPhoto: 'receipt_photo', fuelType: 'fuel_type',
        },
    },
    dailyNotes: {
        table: 'fp_daily_notes',
        columns: {
            id: 'id', date: 'date', content: 'content', tags: 'tags',
            whatIDid: 'what_i_did', createdAt: 'created_at',
            updatedAt: 'updated_at', mood: 'mood', weather: 'weather',
        },
    },
    savedLocations: {
        table: 'fp_saved_locations',
        columns: {
            id: 'id', name: 'name', address: 'address',
            lat: 'lat', lng: 'lng', usageCount: 'usage_count',
            lastUsed: 'last_used',
        },
    },
    vehicles: {
        table: 'fp_vehicles',
        columns: {
            id: 'id', name: 'name', make: 'make', model: 'model',
            year: 'year', color: 'color', licensePlate: 'license_plate',
            isDefault: 'is_default',
        },
    },
    locationLogs: {
        table: 'fp_location_logs',
        columns: {
            id: 'id', shiftId: 'shift_id', lat: 'lat', lng: 'lng',
            placeName: 'place_name', placeType: 'place_type',
            timestamp: 'timestamp',
        },
    },
};

/**
 * GET /api/sync — Pull all data from the server
 */
export async function GET() {
    try {
        const data: Record<string, unknown> = {};

        const TABLES_WITH_CREATED_AT = new Set([
            'fp_time_entries', 'fp_mileage_entries', 'fp_fuel_logs', 'fp_daily_notes',
        ]);

        for (const [key, { table, columns }] of Object.entries(TABLE_MAP)) {
            const orderClause = TABLES_WITH_CREATED_AT.has(table) ? ' ORDER BY created_at DESC NULLS LAST' : '';
            const rows = await query(`SELECT * FROM ${table}${orderClause}`);
            // Map DB columns back to camelCase
            const reverseMap = Object.fromEntries(
                Object.entries(columns).map(([js, db]) => [db, js])
            );
            data[key] = rows.map(row => {
                const mapped: Record<string, unknown> = {};
                for (const [dbCol, value] of Object.entries(row as Record<string, unknown>)) {
                    const jsKey = reverseMap[dbCol] || dbCol;
                    mapped[jsKey] = value;
                }
                return mapped;
            });
        }

        // Also get profile
        const profileRows = await query('SELECT * FROM fp_profile WHERE id = $1', ['default']);
        if (profileRows.length > 0) {
            const row = profileRows[0] as Record<string, unknown>;
            data.profile = {
                name: row.name,
                company: row.company,
                role: row.role,
                defaultStartHour: row.default_start_hour,
                defaultEndHour: row.default_end_hour,
                mileageUnit: row.mileage_unit,
                fuelUnit: row.fuel_unit,
                onboardingComplete: row.onboarding_complete,
                hourlyRate: parseFloat(String(row.hourly_rate || 0)),
                overtimeThreshold: parseFloat(String(row.overtime_threshold || 8)),
                overtimeMultiplier: parseFloat(String(row.overtime_multiplier || 1.5)),
                weeklyGoal: {
                    hoursTarget: row.weekly_goal_hours,
                    milesTarget: row.weekly_goal_miles,
                    fuelBudget: row.weekly_goal_fuel_budget,
                },
                currency: row.currency,
                dateFormat: row.date_format,
                tags: Array.isArray(row.tags) ? row.tags : [],
            };
        }

        // Get settings (custom tags, pinned notes, etc.)
        const settingsRows = await query('SELECT key, value FROM fp_settings');
        const settings: Record<string, unknown> = {};
        for (const row of settingsRows as { key: string; value: unknown }[]) {
            settings[row.key] = row.value;
        }
        data.settings = settings;

        return NextResponse.json({ success: true, data });
    } catch (error) {
        console.error('[sync/pull] Error:', error);
        return NextResponse.json(
            { success: false, message: error instanceof Error ? error.message : 'Pull failed' },
            { status: 500 }
        );
    }
}

/**
 * POST /api/sync — Push (upsert) all data to the server
 * Expects: { profile, timeEntries, mileageEntries, fuelLogs, dailyNotes, ... }
 */
export async function POST(req: NextRequest) {
    try {
        const body = await req.json();

        // Upsert profile
        if (body.profile) {
            const p = body.profile;
            await query(`
                INSERT INTO fp_profile (id, name, company, role, default_start_hour, default_end_hour,
                    mileage_unit, fuel_unit, onboarding_complete, hourly_rate, overtime_threshold,
                    overtime_multiplier, weekly_goal_hours, weekly_goal_miles, weekly_goal_fuel_budget,
                    currency, date_format, tags, updated_at)
                VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, NOW())
                ON CONFLICT (id) DO UPDATE SET
                    name = $2, company = $3, role = $4, default_start_hour = $5, default_end_hour = $6,
                    mileage_unit = $7, fuel_unit = $8, onboarding_complete = $9, hourly_rate = $10,
                    overtime_threshold = $11, overtime_multiplier = $12, weekly_goal_hours = $13,
                    weekly_goal_miles = $14, weekly_goal_fuel_budget = $15, currency = $16,
                    date_format = $17, tags = $18, updated_at = NOW()
            `, [
                'default', p.name || '', p.company || '', p.role || '',
                p.defaultStartHour ?? 7, p.defaultEndHour ?? 17,
                p.mileageUnit || 'miles', p.fuelUnit || 'gallons',
                p.onboardingComplete ?? false, p.hourlyRate ?? 0,
                p.overtimeThreshold ?? 8, p.overtimeMultiplier ?? 1.5,
                p.weeklyGoal?.hoursTarget ?? 40, p.weeklyGoal?.milesTarget ?? 500,
                p.weeklyGoal?.fuelBudget ?? 200, p.currency || 'USD',
                p.dateFormat || 'US', p.tags || [],
            ]);
        }

        // Upsert each collection
        for (const [collectionKey, mapping] of Object.entries(TABLE_MAP)) {
            const items = body[collectionKey];
            if (!Array.isArray(items) || items.length === 0) continue;

            for (const item of items) {
                const dbColumns = Object.entries(mapping.columns)
                    .filter(([jsKey]) => item[jsKey] !== undefined)
                    .map(([, dbCol]) => dbCol);

                const jsKeys = Object.entries(mapping.columns)
                    .filter(([jsKey]) => item[jsKey] !== undefined)
                    .map(([jsKey]) => jsKey);

                const values = jsKeys.map(k => item[k]);
                const placeholders = values.map((_, i) => `$${i + 1}`);

                const updateClauses = dbColumns
                    .filter(col => col !== 'id')
                    .map((col, _idx) => {
                        const paramIdx = dbColumns.indexOf(col) + 1;
                        return `${col} = $${paramIdx}`;
                    });

                if (dbColumns.length > 0 && updateClauses.length > 0) {
                    await query(
                        `INSERT INTO ${mapping.table} (${dbColumns.join(', ')})
                         VALUES (${placeholders.join(', ')})
                         ON CONFLICT (id) DO UPDATE SET ${updateClauses.join(', ')}`,
                        values
                    );
                }
            }
        }

        // Upsert settings
        if (body.settings && typeof body.settings === 'object') {
            for (const [key, value] of Object.entries(body.settings)) {
                await query(
                    `INSERT INTO fp_settings (key, value) VALUES ($1, $2)
                     ON CONFLICT (key) DO UPDATE SET value = $2`,
                    [key, JSON.stringify(value)]
                );
            }
        }

        return NextResponse.json({ success: true, message: 'Sync complete' });
    } catch (error) {
        console.error('[sync/push] Error:', error);
        return NextResponse.json(
            { success: false, message: error instanceof Error ? error.message : 'Push failed' },
            { status: 500 }
        );
    }
}
