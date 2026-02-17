'use client';

import { useEffect, useRef, useState } from 'react';
import type { LocationLog } from '@/lib/store';

// Leaflet CSS needs to be imported in the page that uses this component
// via: import 'leaflet/dist/leaflet.css';

interface ShiftMapProps {
    locations: LocationLog[];
    height?: string;
    darkMode?: boolean;
    showRoute?: boolean;
}

export default function ShiftMap({ locations, height = '300px', darkMode = true, showRoute = true }: ShiftMapProps) {
    const mapRef = useRef<HTMLDivElement>(null);
    const [mapInstance, setMapInstance] = useState<unknown>(null);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!mapRef.current || locations.length === 0) return;
        if (mapInstance) return; // Already initialized

        // Dynamic import to avoid SSR issues
        import('leaflet').then((L) => {
            if (!mapRef.current) return;

            // Fix default marker icons
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            delete (L.Icon.Default.prototype as any)._getIconUrl;
            L.Icon.Default.mergeOptions({
                iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
                iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
                shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
            });

            // Pick tile layer based on theme
            const tileUrl = darkMode
                ? 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png'
                : 'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png';

            const map = L.map(mapRef.current, {
                zoomControl: false,
                attributionControl: false,
            });

            L.tileLayer(tileUrl, {
                maxZoom: 19,
                attribution: '© OpenStreetMap contributors',
            }).addTo(map);

            // Add zoom control to bottom right
            L.control.zoom({ position: 'bottomright' }).addTo(map);

            // Add markers for each location
            const markers: L.LatLng[] = [];

            locations.forEach((loc, i) => {
                const latlng = L.latLng(loc.lat, loc.lng);
                markers.push(latlng);

                const isFirst = i === 0;
                const isLast = i === locations.length - 1;

                // Custom colored circle marker
                const color = isFirst ? '#22c55e' : isLast ? '#ef4444' : '#f59e0b';
                const radius = isFirst || isLast ? 10 : 6;

                const circle = L.circleMarker(latlng, {
                    radius,
                    fillColor: color,
                    color: 'rgba(255,255,255,0.5)',
                    weight: 2,
                    fillOpacity: 0.9,
                }).addTo(map);

                // Popup with location info
                const time = new Date(loc.timestamp).toLocaleTimeString('en-US', {
                    hour: 'numeric',
                    minute: '2-digit',
                });

                const weatherStr = loc.weather
                    ? `<br/>${loc.weather.icon} ${loc.weather.temp}°F — ${loc.weather.condition}`
                    : '';

                circle.bindPopup(
                    `<div style="font-family: system-ui; font-size: 12px;">
            <strong>${isFirst ? '🟢 Start' : isLast ? '🔴 End' : '📍 Check-in'}</strong><br/>
            ${loc.placeName}<br/>
            <span style="opacity: 0.7">${time}</span>
            ${weatherStr}
          </div>`,
                    { className: 'fp-popup' }
                );
            });

            // Draw route polyline
            if (showRoute && markers.length >= 2) {
                L.polyline(markers, {
                    color: '#f59e0b',
                    weight: 3,
                    opacity: 0.6,
                    dashArray: '8, 8',
                    smoothFactor: 1.5,
                }).addTo(map);
            }

            // Fit bounds
            if (markers.length > 0) {
                const bounds = L.latLngBounds(markers);
                map.fitBounds(bounds, { padding: [40, 40], maxZoom: 15 });
            }

            setMapInstance(map);
        }).catch(() => {
            setError('Failed to load map');
        });

        return () => {
            if (mapInstance && typeof (mapInstance as { remove: () => void }).remove === 'function') {
                (mapInstance as { remove: () => void }).remove();
            }
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [locations, darkMode]);

    if (locations.length === 0) {
        return (
            <div
                style={{
                    height,
                    borderRadius: 'var(--fp-radius-lg)',
                    background: 'var(--fp-surface)',
                    border: '1px solid var(--fp-border)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexDirection: 'column',
                    gap: '0.5rem',
                }}
            >
                <span style={{ fontSize: '1.5rem' }}>🗺️</span>
                <span className="text-caption">No location data yet</span>
                <span className="text-caption" style={{ fontSize: '0.625rem', opacity: 0.5 }}>
                    Location pins will appear here during your shift
                </span>
            </div>
        );
    }

    if (error) {
        return (
            <div style={{ height, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <span className="text-caption" style={{ color: 'var(--fp-error)' }}>{error}</span>
            </div>
        );
    }

    return (
        <div
            ref={mapRef}
            style={{
                height,
                borderRadius: 'var(--fp-radius-lg)',
                overflow: 'hidden',
                border: '1px solid var(--fp-border)',
            }}
        />
    );
}
