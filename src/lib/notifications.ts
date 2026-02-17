/**
 * Notification & Reminder Service
 * Uses the Notifications API + setInterval for timed reminders
 */

export type ReminderType =
    | 'shift-end'      // "Did you forget to end your shift?"
    | 'break'          // "You've worked 4h without a break"
    | 'fuel-budget'    // "You're approaching your weekly fuel budget"
    | 'goal-check'     // "You're at 80% of your weekly hours goal"
    | 'custom';

export interface Reminder {
    id: string;
    type: ReminderType;
    title: string;
    body: string;
    intervalMinutes?: number; // recurring
    triggerAt?: string; // ISO date for one-time
    enabled: boolean;
}

// ─── Check Permission ───
export async function requestNotificationPermission(): Promise<'granted' | 'denied' | 'default'> {
    if (!('Notification' in window)) return 'denied';
    if (Notification.permission === 'granted') return 'granted';
    const result = await Notification.requestPermission();
    return result;
}

export function canNotify(): boolean {
    return typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted';
}

// ─── Send Notification ───
export function sendNotification(title: string, body: string, icon?: string): void {
    if (!canNotify()) return;
    try {
        new Notification(title, {
            body,
            icon: icon || '/icons/icon-192x192.png',
            tag: 'fieldpulse',
        });
    } catch {
        // Notifications may fail in certain contexts
    }
}

// ─── Haptic Feedback ───
export function vibrate(pattern: number | number[] = 50): void {
    if (typeof navigator !== 'undefined' && navigator.vibrate) {
        navigator.vibrate(pattern);
    }
}

// Quick haptic patterns
export const haptics = {
    tap: () => vibrate(30),
    success: () => vibrate([50, 50, 100]),
    warning: () => vibrate([100, 50, 100, 50, 100]),
    error: () => vibrate([200, 100, 200]),
};

// ─── Reminder Engine ───
const activeTimers: Map<string, NodeJS.Timeout> = new Map();

export function startReminder(reminder: Reminder): void {
    stopReminder(reminder.id);
    if (!reminder.enabled) return;

    if (reminder.intervalMinutes) {
        const timer = setInterval(() => {
            sendNotification(reminder.title, reminder.body);
        }, reminder.intervalMinutes * 60 * 1000);
        activeTimers.set(reminder.id, timer);
    }
}

export function stopReminder(id: string): void {
    const timer = activeTimers.get(id);
    if (timer) {
        clearInterval(timer);
        activeTimers.delete(id);
    }
}

export function stopAllReminders(): void {
    activeTimers.forEach((timer) => clearInterval(timer));
    activeTimers.clear();
}

// ─── Built-in Reminders ───
export function createShiftEndReminder(hoursWorked: number): Reminder {
    return {
        id: 'shift-end',
        type: 'shift-end',
        title: '⏰ Shift Reminder',
        body: `You've been clocked in for ${hoursWorked} hours. Don't forget to end your shift!`,
        intervalMinutes: 30,
        enabled: true,
    };
}

export function createBreakReminder(): Reminder {
    return {
        id: 'break',
        type: 'break',
        title: '☕ Break Reminder',
        body: "You've been working for 4+ hours without a break. Time for a quick rest!",
        intervalMinutes: 240, // 4 hours
        enabled: true,
    };
}
