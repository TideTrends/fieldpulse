'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { motion } from 'framer-motion';
import { Search, MapPin, X, Crosshair } from 'lucide-react';
import { searchPlaces, getCurrentPosition, reverseGeocode, type SearchResult } from '@/lib/geolocation';

interface LocationSearchProps {
    onSelect: (result: { lat: number; lng: number; name: string; address: string }) => void;
    placeholder?: string;
    showCurrentLocation?: boolean;
}

export default function LocationSearch({
    onSelect,
    placeholder = 'Search for a location...',
    showCurrentLocation = true,
}: LocationSearchProps) {
    const [query, setQuery] = useState('');
    const [results, setResults] = useState<SearchResult[]>([]);
    const [loading, setLoading] = useState(false);
    const [isOpen, setIsOpen] = useState(false);
    const [gettingLocation, setGettingLocation] = useState(false);
    const debounceRef = useRef<NodeJS.Timeout | undefined>(undefined);

    const handleSearch = useCallback(async (q: string) => {
        if (q.length < 3) {
            setResults([]);
            return;
        }
        setLoading(true);

        let nearLat: number | undefined;
        let nearLng: number | undefined;

        try {
            const pos = await getCurrentPosition();
            nearLat = pos.lat;
            nearLng = pos.lng;
        } catch {
            // No permissions or error, search anyway
        }

        const res = await searchPlaces(q, 10, nearLat, nearLng);
        setResults(res);
        setLoading(false);
        setIsOpen(true);
    }, []);

    useEffect(() => {
        if (debounceRef.current) clearTimeout(debounceRef.current);
        debounceRef.current = setTimeout(() => handleSearch(query), 400);
        return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
    }, [query, handleSearch]);

    const handleCurrentLocation = async () => {
        setGettingLocation(true);
        try {
            const pos = await getCurrentPosition();
            const place = await reverseGeocode(pos.lat, pos.lng);
            onSelect({
                lat: pos.lat,
                lng: pos.lng,
                name: place.name,
                address: place.displayName,
            });
            setQuery(place.name);
            setIsOpen(false);
        } catch {
            // Permission denied or error
        }
        setGettingLocation(false);
    };

    const handleSelect = (result: SearchResult) => {
        onSelect({
            lat: result.lat,
            lng: result.lng,
            name: result.displayName.split(',')[0],
            address: result.displayName,
        });
        setQuery(result.displayName.split(',')[0]);
        setIsOpen(false);
    };

    return (
        <div style={{ position: 'relative' }}>
            <div style={{ display: 'flex', gap: '0.375rem' }}>
                <div style={{ flex: 1, position: 'relative' }}>
                    <Search
                        size={14}
                        style={{
                            position: 'absolute',
                            left: '0.625rem',
                            top: '50%',
                            transform: 'translateY(-50%)',
                            color: 'var(--fp-text-muted)',
                            pointerEvents: 'none',
                        }}
                    />
                    <input
                        className="input"
                        style={{ paddingLeft: '2rem' }}
                        type="text"
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        placeholder={placeholder}
                        onFocus={() => results.length > 0 && setIsOpen(true)}
                    />
                    {query && (
                        <button
                            onClick={() => { setQuery(''); setResults([]); setIsOpen(false); }}
                            style={{
                                position: 'absolute',
                                right: '0.5rem',
                                top: '50%',
                                transform: 'translateY(-50%)',
                                background: 'none',
                                border: 'none',
                                color: 'var(--fp-text-muted)',
                                cursor: 'pointer',
                                padding: '2px',
                            }}
                        >
                            <X size={14} />
                        </button>
                    )}
                </div>

                {showCurrentLocation && (
                    <button
                        className="btn btn-secondary btn-icon"
                        style={{ width: 40, height: 40, flexShrink: 0 }}
                        onClick={handleCurrentLocation}
                        disabled={gettingLocation}
                        title="Use current location"
                    >
                        <Crosshair size={16} className={gettingLocation ? 'animate-pulse-dot' : ''} />
                    </button>
                )}
            </div>

            {/* Results Dropdown */}
            {isOpen && (results.length > 0 || loading) && (
                <motion.div
                    initial={{ opacity: 0, y: -4 }}
                    animate={{ opacity: 1, y: 0 }}
                    style={{
                        position: 'absolute',
                        top: '100%',
                        left: 0,
                        right: 0,
                        marginTop: '0.25rem',
                        background: 'var(--fp-surface)',
                        border: '1px solid var(--fp-border)',
                        borderRadius: 'var(--fp-radius-md)',
                        zIndex: 50,
                        maxHeight: 200,
                        overflowY: 'auto',
                        boxShadow: '0 4px 20px rgba(0,0,0,0.3)',
                    }}
                >
                    {loading ? (
                        <div style={{ padding: '0.75rem', textAlign: 'center' }}>
                            <span className="text-caption">Searching...</span>
                        </div>
                    ) : (
                        results.map((result, i) => (
                            <button
                                key={i}
                                onClick={() => handleSelect(result)}
                                style={{
                                    width: '100%',
                                    display: 'flex',
                                    alignItems: 'flex-start',
                                    gap: '0.5rem',
                                    padding: '0.5rem 0.75rem',
                                    background: 'none',
                                    border: 'none',
                                    borderBottom: i < results.length - 1 ? '1px solid var(--fp-border)' : 'none',
                                    cursor: 'pointer',
                                    textAlign: 'left',
                                    color: 'var(--fp-text)',
                                }}
                            >
                                <MapPin size={14} style={{ color: 'var(--fp-amber)', marginTop: '2px', flexShrink: 0 }} />
                                <span className="text-caption" style={{ fontSize: '0.75rem', lineHeight: 1.3 }}>
                                    {result.displayName}
                                </span>
                            </button>
                        ))
                    )}
                </motion.div>
            )}
        </div>
    );
}
