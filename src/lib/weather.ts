/**
 * Weather Service
 * Uses Open-Meteo API — completely free, no API key required
 */

export interface WeatherData {
    temperature: number; // °F
    feelsLike: number;
    humidity: number;
    windSpeed: number; // mph
    condition: WeatherCondition;
    icon: string; // emoji
    description: string;
}

export type WeatherCondition =
    | 'clear' | 'partly-cloudy' | 'cloudy' | 'fog'
    | 'drizzle' | 'rain' | 'heavy-rain'
    | 'snow' | 'heavy-snow' | 'thunderstorm';

// WMO Weather interpretation codes → condition mapping
const WMO_CODES: Record<number, { condition: WeatherCondition; icon: string; desc: string }> = {
    0: { condition: 'clear', icon: '☀️', desc: 'Clear sky' },
    1: { condition: 'clear', icon: '🌤️', desc: 'Mainly clear' },
    2: { condition: 'partly-cloudy', icon: '⛅', desc: 'Partly cloudy' },
    3: { condition: 'cloudy', icon: '☁️', desc: 'Overcast' },
    45: { condition: 'fog', icon: '🌫️', desc: 'Fog' },
    48: { condition: 'fog', icon: '🌫️', desc: 'Rime fog' },
    51: { condition: 'drizzle', icon: '🌦️', desc: 'Light drizzle' },
    53: { condition: 'drizzle', icon: '🌦️', desc: 'Moderate drizzle' },
    55: { condition: 'drizzle', icon: '🌧️', desc: 'Dense drizzle' },
    61: { condition: 'rain', icon: '🌧️', desc: 'Slight rain' },
    63: { condition: 'rain', icon: '🌧️', desc: 'Moderate rain' },
    65: { condition: 'heavy-rain', icon: '🌧️', desc: 'Heavy rain' },
    71: { condition: 'snow', icon: '🌨️', desc: 'Slight snow' },
    73: { condition: 'snow', icon: '🌨️', desc: 'Moderate snow' },
    75: { condition: 'heavy-snow', icon: '❄️', desc: 'Heavy snow' },
    80: { condition: 'rain', icon: '🌧️', desc: 'Slight showers' },
    81: { condition: 'rain', icon: '🌧️', desc: 'Moderate showers' },
    82: { condition: 'heavy-rain', icon: '⛈️', desc: 'Violent showers' },
    95: { condition: 'thunderstorm', icon: '⛈️', desc: 'Thunderstorm' },
    96: { condition: 'thunderstorm', icon: '⛈️', desc: 'Thunderstorm w/ hail' },
    99: { condition: 'thunderstorm', icon: '⛈️', desc: 'Thunderstorm w/ heavy hail' },
};

function getWeatherInfo(code: number) {
    return WMO_CODES[code] || { condition: 'clear' as WeatherCondition, icon: '🌤️', desc: 'Unknown' };
}

export async function fetchWeather(lat: number, lng: number): Promise<WeatherData> {
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lng}&current=temperature_2m,relative_humidity_2m,apparent_temperature,weather_code,wind_speed_10m&temperature_unit=fahrenheit&wind_speed_unit=mph&timezone=auto`;

    try {
        const res = await fetch(url);
        const data = await res.json();
        const current = data.current;
        const info = getWeatherInfo(current.weather_code);

        return {
            temperature: Math.round(current.temperature_2m),
            feelsLike: Math.round(current.apparent_temperature),
            humidity: current.relative_humidity_2m,
            windSpeed: Math.round(current.wind_speed_10m),
            condition: info.condition,
            icon: info.icon,
            description: info.desc,
        };
    } catch {
        return {
            temperature: 0,
            feelsLike: 0,
            humidity: 0,
            windSpeed: 0,
            condition: 'clear',
            icon: '🌤️',
            description: 'Weather unavailable',
        };
    }
}

// Simple cache to avoid spamming Open-Meteo
let cachedWeather: { data: WeatherData; timestamp: number; lat: number; lng: number } | null = null;
const CACHE_TTL = 10 * 60 * 1000; // 10 minutes

export async function getWeatherCached(lat: number, lng: number): Promise<WeatherData> {
    if (
        cachedWeather &&
        Date.now() - cachedWeather.timestamp < CACHE_TTL &&
        Math.abs(cachedWeather.lat - lat) < 0.01 &&
        Math.abs(cachedWeather.lng - lng) < 0.01
    ) {
        return cachedWeather.data;
    }

    const data = await fetchWeather(lat, lng);
    cachedWeather = { data, timestamp: Date.now(), lat, lng };
    return data;
}
