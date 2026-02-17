import { query } from './db';

/**
 * Run database migrations — creates all tables if they don't exist.
 * Safe to run multiple times (uses IF NOT EXISTS).
 */
export async function runMigrations(): Promise<void> {
    await query(`
        CREATE TABLE IF NOT EXISTS fp_profile (
            id TEXT PRIMARY KEY DEFAULT 'default',
            name TEXT NOT NULL DEFAULT '',
            company TEXT NOT NULL DEFAULT '',
            role TEXT NOT NULL DEFAULT '',
            default_start_hour INTEGER NOT NULL DEFAULT 7,
            default_end_hour INTEGER NOT NULL DEFAULT 17,
            mileage_unit TEXT NOT NULL DEFAULT 'miles',
            fuel_unit TEXT NOT NULL DEFAULT 'gallons',
            onboarding_complete BOOLEAN NOT NULL DEFAULT false,
            hourly_rate NUMERIC(10,2) NOT NULL DEFAULT 0,
            overtime_threshold NUMERIC(4,1) NOT NULL DEFAULT 8,
            overtime_multiplier NUMERIC(4,2) NOT NULL DEFAULT 1.5,
            weekly_goal_hours INTEGER NOT NULL DEFAULT 40,
            weekly_goal_miles INTEGER NOT NULL DEFAULT 500,
            weekly_goal_fuel_budget INTEGER NOT NULL DEFAULT 200,
            currency TEXT NOT NULL DEFAULT 'USD',
            date_format TEXT NOT NULL DEFAULT 'US',
            updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        );
    `);

    await query(`
        CREATE TABLE IF NOT EXISTS fp_time_entries (
            id TEXT PRIMARY KEY,
            start_time TEXT NOT NULL,
            end_time TEXT,
            break_minutes INTEGER NOT NULL DEFAULT 0,
            notes TEXT NOT NULL DEFAULT '',
            tags TEXT[] NOT NULL DEFAULT '{}',
            date TEXT NOT NULL,
            is_overtime BOOLEAN NOT NULL DEFAULT false,
            hourly_rate NUMERIC(10,2),
            created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        );
    `);

    await query(`
        CREATE TABLE IF NOT EXISTS fp_mileage_entries (
            id TEXT PRIMARY KEY,
            date TEXT NOT NULL,
            start_mileage NUMERIC(10,1) NOT NULL,
            end_mileage NUMERIC(10,1),
            trip_miles NUMERIC(10,1) NOT NULL DEFAULT 0,
            start_location TEXT NOT NULL DEFAULT '',
            end_location TEXT NOT NULL DEFAULT '',
            notes TEXT NOT NULL DEFAULT '',
            linked_time_entry_id TEXT,
            purpose TEXT NOT NULL DEFAULT 'work',
            created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        );
    `);

    await query(`
        CREATE TABLE IF NOT EXISTS fp_fuel_logs (
            id TEXT PRIMARY KEY,
            date TEXT NOT NULL,
            time TEXT NOT NULL DEFAULT '',
            mileage NUMERIC(10,1) NOT NULL,
            gallons NUMERIC(10,3) NOT NULL,
            cost_per_gallon NUMERIC(10,3) NOT NULL,
            total_cost NUMERIC(10,2) NOT NULL,
            station TEXT NOT NULL DEFAULT '',
            notes TEXT NOT NULL DEFAULT '',
            receipt_photo TEXT,
            fuel_type TEXT NOT NULL DEFAULT 'regular',
            created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        );
    `);

    await query(`
        CREATE TABLE IF NOT EXISTS fp_daily_notes (
            id TEXT PRIMARY KEY,
            date TEXT NOT NULL,
            content TEXT NOT NULL DEFAULT '',
            tags TEXT[] NOT NULL DEFAULT '{}',
            what_i_did TEXT NOT NULL DEFAULT '',
            created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
            updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
            mood TEXT,
            weather TEXT
        );
    `);

    await query(`
        CREATE TABLE IF NOT EXISTS fp_saved_locations (
            id TEXT PRIMARY KEY,
            name TEXT NOT NULL,
            address TEXT NOT NULL DEFAULT '',
            lat NUMERIC(10,6),
            lng NUMERIC(10,6),
            usage_count INTEGER NOT NULL DEFAULT 0,
            last_used TEXT NOT NULL DEFAULT ''
        );
    `);

    await query(`
        CREATE TABLE IF NOT EXISTS fp_vehicles (
            id TEXT PRIMARY KEY,
            name TEXT NOT NULL,
            make TEXT NOT NULL DEFAULT '',
            model TEXT NOT NULL DEFAULT '',
            year INTEGER NOT NULL DEFAULT 2020,
            color TEXT NOT NULL DEFAULT '',
            license_plate TEXT NOT NULL DEFAULT '',
            is_default BOOLEAN NOT NULL DEFAULT false
        );
    `);

    await query(`
        CREATE TABLE IF NOT EXISTS fp_location_logs (
            id TEXT PRIMARY KEY,
            shift_id TEXT,
            lat NUMERIC(10,6) NOT NULL,
            lng NUMERIC(10,6) NOT NULL,
            place_name TEXT NOT NULL DEFAULT '',
            place_type TEXT NOT NULL DEFAULT '',
            timestamp TEXT NOT NULL,
            weather_temp NUMERIC(5,1),
            weather_condition TEXT,
            weather_icon TEXT
        );
    `);

    await query(`
        CREATE TABLE IF NOT EXISTS fp_settings (
            key TEXT PRIMARY KEY,
            value JSONB NOT NULL DEFAULT '{}'
        );
    `);

    // Create indexes for common queries
    await query(`CREATE INDEX IF NOT EXISTS idx_time_entries_date ON fp_time_entries(date);`);
    await query(`CREATE INDEX IF NOT EXISTS idx_mileage_entries_date ON fp_mileage_entries(date);`);
    await query(`CREATE INDEX IF NOT EXISTS idx_fuel_logs_date ON fp_fuel_logs(date);`);
    await query(`CREATE INDEX IF NOT EXISTS idx_daily_notes_date ON fp_daily_notes(date);`);
    await query(`CREATE INDEX IF NOT EXISTS idx_location_logs_shift ON fp_location_logs(shift_id);`);

    console.log('[FieldPulse] Database migrations complete');
}
