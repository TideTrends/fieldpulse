/**
 * Smart Insights Engine
 * Pattern detection, anomaly alerts, predictive estimates — all client-side
 */

import { TimeEntry, MileageEntry, FuelLog, getHoursFromEntry } from './store';

export interface Insight {
    id: string;
    type: 'pattern' | 'anomaly' | 'prediction' | 'streak' | 'tip';
    icon: string;
    title: string;
    body: string;
    severity: 'info' | 'warn' | 'success';
    timestamp: string;
}

// ─── Pattern Detection ───
function detectPatterns(timeEntries: TimeEntry[]): Insight[] {
    const insights: Insight[] = [];
    if (timeEntries.length < 5) return insights;

    // Average start time
    const startTimes = timeEntries
        .filter(e => e.startTime)
        .map(e => {
            const d = new Date(e.startTime);
            return d.getHours() + d.getMinutes() / 60;
        });

    if (startTimes.length >= 3) {
        const avgStart = startTimes.reduce((a, b) => a + b, 0) / startTimes.length;
        const h = Math.floor(avgStart);
        const m = Math.round((avgStart - h) * 60);
        insights.push({
            id: 'pattern-start-time',
            type: 'pattern',
            icon: '🕐',
            title: 'Your Usual Start',
            body: `You typically start work around ${h}:${m.toString().padStart(2, '0')} AM`,
            severity: 'info',
            timestamp: new Date().toISOString(),
        });
    }

    // Busiest day of week
    const dayHours: Record<number, number[]> = {};
    timeEntries.forEach(e => {
        const day = new Date(e.date).getDay();
        if (!dayHours[day]) dayHours[day] = [];
        dayHours[day].push(getHoursFromEntry(e));
    });

    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    let busiestDay = 0;
    let busiestAvg = 0;
    Object.entries(dayHours).forEach(([day, hours]) => {
        const avg = hours.reduce((a, b) => a + b, 0) / hours.length;
        if (avg > busiestAvg) {
            busiestAvg = avg;
            busiestDay = parseInt(day);
        }
    });

    if (busiestAvg > 0) {
        insights.push({
            id: 'pattern-busiest-day',
            type: 'pattern',
            icon: '📊',
            title: 'Busiest Day',
            body: `${days[busiestDay]}s are your longest days, averaging ${busiestAvg.toFixed(1)} hours`,
            severity: 'info',
            timestamp: new Date().toISOString(),
        });
    }

    return insights;
}

// ─── Anomaly Detection ───
function detectAnomalies(
    timeEntries: TimeEntry[],
    mileageEntries: MileageEntry[]
): Insight[] {
    const insights: Insight[] = [];

    // No break detection (>6 hours without break)
    const today = new Date().toISOString().split('T')[0];
    const todayEntries = timeEntries.filter(e => e.date === today);
    const todayHours = todayEntries.reduce((s, e) => s + getHoursFromEntry(e), 0);

    if (todayHours > 6) {
        const hasBreak = todayEntries.some(e => e.breakMinutes && e.breakMinutes > 0);
        if (!hasBreak) {
            insights.push({
                id: 'anomaly-no-break',
                type: 'anomaly',
                icon: '⚠️',
                title: 'No Break Logged',
                body: `You've worked ${todayHours.toFixed(1)} hours today without a break. Take a rest!`,
                severity: 'warn',
                timestamp: new Date().toISOString(),
            });
        }
    }

    // Unusual mileage
    if (mileageEntries.length >= 7) {
        const recentMiles = mileageEntries.slice(0, 7).reduce((s, e) => s + e.tripMiles, 0) / 7;
        const todayMiles = mileageEntries
            .filter(e => e.date === today)
            .reduce((s, e) => s + e.tripMiles, 0);

        if (todayMiles > recentMiles * 2.5 && todayMiles > 10) {
            insights.push({
                id: 'anomaly-high-mileage',
                type: 'anomaly',
                icon: '🚗',
                title: 'Unusual Mileage',
                body: `You drove ${todayMiles.toFixed(0)} miles today — ${(todayMiles / recentMiles).toFixed(1)}× your recent average`,
                severity: 'warn',
                timestamp: new Date().toISOString(),
            });
        }
    }

    return insights;
}

// ─── Predictive Estimates ───
function generatePredictions(
    timeEntries: TimeEntry[],
    weeklyHoursTarget: number
): Insight[] {
    const insights: Insight[] = [];

    const now = new Date();
    const dayOfWeek = now.getDay(); // 0=Sun
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - dayOfWeek);
    startOfWeek.setHours(0, 0, 0, 0);

    const weekEntries = timeEntries.filter(e => new Date(e.date) >= startOfWeek);
    const weekHours = weekEntries.reduce((s, e) => s + getHoursFromEntry(e), 0);

    if (dayOfWeek >= 1 && dayOfWeek <= 5) {
        const avgPerDay = weekHours / Math.max(dayOfWeek, 1);
        const daysLeft = 5 - dayOfWeek; // workdays remaining
        const projected = weekHours + avgPerDay * daysLeft;

        const pct = Math.round((projected / weeklyHoursTarget) * 100);

        insights.push({
            id: 'predict-weekly',
            type: 'prediction',
            icon: '🔮',
            title: 'Week Projection',
            body: `At this pace, you'll hit ${projected.toFixed(1)}h by Friday (${pct}% of your ${weeklyHoursTarget}h goal)`,
            severity: pct >= 90 ? 'success' : pct >= 70 ? 'info' : 'warn',
            timestamp: new Date().toISOString(),
        });
    }

    return insights;
}

// ─── Streak Analysis ───
function analyzeStreaks(timeEntries: TimeEntry[]): Insight[] {
    const insights: Insight[] = [];
    if (timeEntries.length < 3) return insights;

    // Count consecutive work days
    const dates = [...new Set(timeEntries.map(e => e.date))].sort().reverse();
    let streak = 0;
    const today = new Date();

    for (let i = 0; i < dates.length; i++) {
        const expected = new Date(today);
        expected.setDate(today.getDate() - i);
        const expectedStr = expected.toISOString().split('T')[0];

        // Skip weekends
        if (expected.getDay() === 0 || expected.getDay() === 6) continue;

        if (dates.includes(expectedStr)) {
            streak++;
        } else {
            break;
        }
    }

    if (streak >= 3) {
        insights.push({
            id: 'streak-work',
            type: 'streak',
            icon: '🔥',
            title: `${streak}-Day Streak!`,
            body: `You've logged work for ${streak} consecutive workdays. Keep it up!`,
            severity: 'success',
            timestamp: new Date().toISOString(),
        });
    }

    return insights;
}

// ─── Efficiency Score ───
function calculateEfficiency(
    timeEntries: TimeEntry[],
    mileageEntries: MileageEntry[],
    fuelLogs: FuelLog[]
): Insight[] {
    const insights: Insight[] = [];

    const totalHours = timeEntries.reduce((s, e) => s + getHoursFromEntry(e), 0);
    const totalMiles = mileageEntries.reduce((s, e) => s + e.tripMiles, 0);
    const totalFuelCost = fuelLogs.reduce((s, l) => s + l.totalCost, 0);

    if (totalHours > 0 && totalMiles > 0) {
        const milesPerHour = totalMiles / totalHours;
        insights.push({
            id: 'efficiency-mph',
            type: 'tip',
            icon: '⚡',
            title: 'Travel Efficiency',
            body: `You average ${milesPerHour.toFixed(1)} miles per work hour. ${milesPerHour > 30 ? 'Lots of driving!' : 'Mostly on-site work.'}`,
            severity: 'info',
            timestamp: new Date().toISOString(),
        });
    }

    if (totalFuelCost > 0 && totalMiles > 0) {
        const costPerMile = totalFuelCost / totalMiles;
        insights.push({
            id: 'efficiency-cost',
            type: 'tip',
            icon: '💰',
            title: 'Cost per Mile',
            body: `Your fuel cost averages $${costPerMile.toFixed(2)}/mile`,
            severity: costPerMile > 0.25 ? 'warn' : 'info',
            timestamp: new Date().toISOString(),
        });
    }

    return insights;
}

// ─── Generate All Insights ───
export function generateInsights(
    timeEntries: TimeEntry[],
    mileageEntries: MileageEntry[],
    fuelLogs: FuelLog[],
    weeklyHoursTarget: number
): Insight[] {
    return [
        ...detectPatterns(timeEntries),
        ...detectAnomalies(timeEntries, mileageEntries),
        ...generatePredictions(timeEntries, weeklyHoursTarget),
        ...analyzeStreaks(timeEntries),
        ...calculateEfficiency(timeEntries, mileageEntries, fuelLogs),
    ];
}
