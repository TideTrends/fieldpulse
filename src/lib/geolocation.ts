/**
 * Geolocation Service
 * - GPS position via navigator.geolocation
 * - Reverse geocoding via Nominatim (free, no API key)
 * - Location search via Nominatim
 * - Background polling during shifts
 */

export interface GeoPosition {
    lat: number;
    lng: number;
    accuracy: number;
    timestamp: number;
}

export interface PlaceInfo {
    name: string;
    displayName: string;
    type: string; // e.g. "fuel", "restaurant", "office"
    address: {
        road?: string;
        city?: string;
        state?: string;
        postcode?: string;
        country?: string;
    };
}

export interface LocationPin {
    id: string;
    lat: number;
    lng: number;
    placeName: string;
    placeType: string;
    timestamp: string; // ISO
    weather?: {
        temp: number;
        condition: string;
        icon: string;
    };
}

export interface SearchResult {
    lat: number;
    lng: number;
    displayName: string;
    type: string;
    importance: number;
}

// ─── Get Current Position ───
export function getCurrentPosition(): Promise<GeoPosition> {
    return new Promise((resolve, reject) => {
        if (!navigator.geolocation) {
            reject(new Error('Geolocation not supported'));
            return;
        }
        navigator.geolocation.getCurrentPosition(
            (pos) => {
                resolve({
                    lat: pos.coords.latitude,
                    lng: pos.coords.longitude,
                    accuracy: pos.coords.accuracy,
                    timestamp: pos.timestamp,
                });
            },
            (err) => reject(err),
            { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 }
        );
    });
}

// ─── Watch Position (returns cleanup function) ───
export function watchPosition(
    onUpdate: (pos: GeoPosition) => void,
    onError?: (err: GeolocationPositionError) => void
): () => void {
    if (!navigator.geolocation) return () => { };

    const id = navigator.geolocation.watchPosition(
        (pos) => {
            onUpdate({
                lat: pos.coords.latitude,
                lng: pos.coords.longitude,
                accuracy: pos.coords.accuracy,
                timestamp: pos.timestamp,
            });
        },
        onError,
        { enableHighAccuracy: true, maximumAge: 30000 }
    );

    return () => navigator.geolocation.clearWatch(id);
}

// ─── Reverse Geocode (Nominatim – free, no key) ───
export async function reverseGeocode(lat: number, lng: number): Promise<PlaceInfo> {
    try {
        const res = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`,
            { headers: { 'User-Agent': 'FieldPulse/2.0' } }
        );
        const data = await res.json();

        return {
            name: data.name || data.display_name?.split(',')[0] || 'Unknown',
            displayName: data.display_name || 'Unknown location',
            type: data.type || 'unknown',
            address: {
                road: data.address?.road,
                city: data.address?.city || data.address?.town || data.address?.village,
                state: data.address?.state,
                postcode: data.address?.postcode,
                country: data.address?.country,
            },
        };
    } catch {
        return {
            name: 'Unknown',
            displayName: `${lat.toFixed(4)}, ${lng.toFixed(4)}`,
            type: 'unknown',
            address: {},
        };
    }
}

// ─── Search Places (Nominatim – free, no key) ───
export async function searchPlaces(query: string, limit = 5): Promise<SearchResult[]> {
    if (!query.trim()) return [];

    try {
        const res = await fetch(
            `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=${limit}&addressdetails=1`,
            { headers: { 'User-Agent': 'FieldPulse/2.0' } }
        );
        const data = await res.json();

        return data.map((item: Record<string, unknown>) => ({
            lat: parseFloat(item.lat as string),
            lng: parseFloat(item.lon as string),
            displayName: item.display_name as string,
            type: item.type as string,
            importance: item.importance as number,
        }));
    } catch {
        return [];
    }
}

// ─── Background Location Polling ───
let pollingInterval: NodeJS.Timeout | null = null;

export function startBackgroundPolling(
    intervalMs: number,
    onLocation: (pos: GeoPosition, place: PlaceInfo) => void
): void {
    stopBackgroundPolling();

    pollingInterval = setInterval(async () => {
        try {
            const pos = await getCurrentPosition();
            const place = await reverseGeocode(pos.lat, pos.lng);
            onLocation(pos, place);
        } catch {
            // Silent fail — location may be unavailable
        }
    }, intervalMs);
}

export function stopBackgroundPolling(): void {
    if (pollingInterval) {
        clearInterval(pollingInterval);
        pollingInterval = null;
    }
}

// ─── Distance between two points (Haversine) ───
export function distanceBetween(
    lat1: number, lng1: number,
    lat2: number, lng2: number
): number {
    const R = 3959; // Earth radius in miles
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLng = ((lng2 - lng1) * Math.PI) / 180;
    const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos((lat1 * Math.PI) / 180) *
        Math.cos((lat2 * Math.PI) / 180) *
        Math.sin(dLng / 2) *
        Math.sin(dLng / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
}

// ─── Check if location permissions available ───
export async function checkLocationPermission(): Promise<'granted' | 'denied' | 'prompt'> {
    if (!navigator.permissions) return 'prompt';
    try {
        const result = await navigator.permissions.query({ name: 'geolocation' });
        return result.state;
    } catch {
        return 'prompt';
    }
}
