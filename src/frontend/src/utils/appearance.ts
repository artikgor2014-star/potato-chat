import type { Appearance } from '@bindings/potato-chat/internal/config/models.js';

export const ACCENTS = ['violet', 'blue', 'pink', 'green', 'amber'] as const;

export type Accent = (typeof ACCENTS)[number];

export const ACCENT_COLORS: Record<Accent, string> = {
    violet: '#a855f7',
    blue: '#4f8cff',
    pink: '#f472b6',
    green: '#34d399',
    amber: '#f0b25a',
};

const DEFAULT_ACCENT: Accent = 'violet';
const MIN_SCALE = 90;
const MAX_SCALE = 130;

function normalizeScale(value: number | undefined): number {
    if (!value || Number.isNaN(value)) {
        return 100;
    }

    return Math.min(MAX_SCALE, Math.max(MIN_SCALE, Math.round(value)));
}

/**
 * Applies appearance preferences to the document root. Everything is driven by
 * data attributes and one CSS variable, so the stylesheet stays declarative and
 * the values survive re-renders without touching individual components.
 */
export function applyAppearance(appearance: Appearance | undefined) {
    const root = document.documentElement;
    const accent = appearance?.accent as Accent | undefined;

    root.dataset.accent = accent && ACCENTS.includes(accent) ? accent : DEFAULT_ACCENT;
    root.style.setProperty('--ui-scale', String(normalizeScale(appearance?.scale) / 100));

    if (appearance?.compact) {
        root.dataset.compact = '';
    } else {
        delete root.dataset.compact;
    }
}

export { DEFAULT_ACCENT, MAX_SCALE, MIN_SCALE };
