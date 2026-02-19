'use server';

import { queryOne, execute, query } from '@/lib/db';
import { setSession, clearSession } from '@/lib/auth';
import { compare, hash } from 'bcryptjs';

export async function loginUser(formData: FormData) {
    const email = formData.get('email') as string;
    const password = formData.get('password') as string;

    if (!email || !password) return { error: 'Email and password required' };

    const user = await queryOne('SELECT * FROM fp_users WHERE email = $1', [email]);
    if (!user) {
        // Auto-register for the first user if the table is empty
        const countRes = await queryOne('SELECT COUNT(*) as count FROM fp_users');
        if (Number(countRes?.count) === 0) {
            const passwordHash = await hash(password, 10);
            const userId = 'usr_' + Math.random().toString(36).substring(2);
            await execute('INSERT INTO fp_users (id, email, password_hash) VALUES ($1, $2, $3)', [userId, email, passwordHash]);

            // Take ownership of existing "default" data
            const tables = [
                'fp_profile', 'fp_time_entries', 'fp_mileage_entries', 'fp_fuel_logs',
                'fp_daily_notes', 'fp_saved_locations', 'fp_vehicles', 'fp_location_logs'
            ];

            for (const table of tables) {
                try {
                    await execute(`UPDATE ${table} SET user_id = $1 WHERE user_id = 'default'`, [userId]);
                } catch (e) {
                    console.error(`Error migrating ownership for ${table}`, e);
                }
            }

            await setSession(userId, email);
            return { success: true };
        }
        return { error: 'Invalid credentials' };
    }

    const isValid = await compare(password, user.password_hash as string);
    if (!isValid) return { error: 'Invalid credentials' };

    await setSession(user.id as string, email);
    return { success: true };
}

export async function logoutUser() {
    await clearSession();
}
