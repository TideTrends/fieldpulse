/**
 * Voice Service
 * Uses Web Speech API — free, built into all modern browsers
 * Provides speech-to-text for notes and voice commands
 */

export interface VoiceResult {
    transcript: string;
    confidence: number;
    isFinal: boolean;
}

type SpeechRecognitionType = {
    continuous: boolean;
    interimResults: boolean;
    lang: string;
    onresult: ((event: { results: SpeechRecognitionResultList }) => void) | null;
    onerror: ((event: { error: string }) => void) | null;
    onend: (() => void) | null;
    start: () => void;
    stop: () => void;
    abort: () => void;
};

// ─── Check if Speech Recognition is available ───
export function isSpeechAvailable(): boolean {
    if (typeof window === 'undefined') return false;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return !!(window as any).SpeechRecognition || !!(window as any).webkitSpeechRecognition;
}

// ─── Create a recognition instance ───
function createRecognition(): SpeechRecognitionType | null {
    if (typeof window === 'undefined') return null;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const SpeechRec = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRec) return null;
    return new SpeechRec() as SpeechRecognitionType;
}

// ─── Single-shot transcription ───
export function transcribe(
    onResult: (result: VoiceResult) => void,
    onEnd?: () => void,
    onError?: (error: string) => void,
    lang = 'en-US'
): { stop: () => void } | null {
    const recognition = createRecognition();
    if (!recognition) {
        onError?.('Speech recognition not supported');
        return null;
    }

    recognition.continuous = false;
    recognition.interimResults = true;
    recognition.lang = lang;

    recognition.onresult = (event) => {
        const last = event.results[event.results.length - 1];
        if (last) {
            onResult({
                transcript: last[0].transcript,
                confidence: last[0].confidence,
                isFinal: last.isFinal,
            });
        }
    };

    recognition.onerror = (event) => {
        onError?.(event.error);
    };

    recognition.onend = () => {
        onEnd?.();
    };

    recognition.start();

    return {
        stop: () => {
            try { recognition.stop(); } catch { /* already stopped */ }
        },
    };
}

// ─── Continuous transcription (for longer notes) ───
export function transcribeContinuous(
    onResult: (result: VoiceResult) => void,
    onEnd?: () => void,
    onError?: (error: string) => void,
    lang = 'en-US'
): { stop: () => void } | null {
    const recognition = createRecognition();
    if (!recognition) {
        onError?.('Speech recognition not supported');
        return null;
    }

    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = lang;

    recognition.onresult = (event) => {
        for (let i = 0; i < event.results.length; i++) {
            const result = event.results[i];
            onResult({
                transcript: result[0].transcript,
                confidence: result[0].confidence,
                isFinal: result.isFinal,
            });
        }
    };

    recognition.onerror = (event) => {
        if (event.error !== 'aborted') {
            onError?.(event.error);
        }
    };

    recognition.onend = () => {
        onEnd?.();
    };

    recognition.start();

    return {
        stop: () => {
            try { recognition.stop(); } catch { /* already stopped */ }
        },
    };
}

// ─── Parse voice commands ───
export interface VoiceCommand {
    action: 'start-shift' | 'end-shift' | 'log-fuel' | 'add-note' | 'log-mileage' | 'unknown';
    params: Record<string, string>;
    raw: string;
}

export function parseVoiceCommand(text: string): VoiceCommand {
    const lower = text.toLowerCase().trim();

    // Start shift
    if (lower.match(/^(start|begin|clock in|punch in)/)) {
        return { action: 'start-shift', params: {}, raw: text };
    }

    // End shift
    if (lower.match(/^(stop|end|clock out|punch out|finish)/)) {
        return { action: 'end-shift', params: {}, raw: text };
    }

    // Log fuel: "log 10 gallons at Shell"
    const fuelMatch = lower.match(/log (\d+\.?\d*) gallons?(?: at (.+))?/);
    if (fuelMatch) {
        return {
            action: 'log-fuel',
            params: { gallons: fuelMatch[1], station: fuelMatch[2] || '' },
            raw: text,
        };
    }

    // Log mileage: "drove 25 miles"
    const mileMatch = lower.match(/(?:drove|drive|log) (\d+\.?\d*) miles?/);
    if (mileMatch) {
        return {
            action: 'log-mileage',
            params: { miles: mileMatch[1] },
            raw: text,
        };
    }

    // Note: anything else → treat as a note
    if (lower.length > 5) {
        return { action: 'add-note', params: { text }, raw: text };
    }

    return { action: 'unknown', params: {}, raw: text };
}
