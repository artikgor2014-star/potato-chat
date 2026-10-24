import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';

/**
 * Captures a key combination and stores it in the Go hotkey format
 * (`ctrl+shift+h`). Modifiers are normalised to lowercase; the key keeps the
 * names the backend's parser understands.
 */

const KEY_ALIASES: Record<string, string> = {
    ArrowLeft: 'left',
    ArrowRight: 'right',
    ArrowUp: 'up',
    ArrowDown: 'down',
    ' ': 'space',
    Backspace: 'delete',
    '-': 'minus',
    '=': 'equal',
    ',': 'comma',
    '.': 'period',
    '/': 'slash',
    ';': 'semicolon',
    "'": 'quote',
    '[': 'bracketleft',
    ']': 'bracketright',
    '\\': 'backslash',
    '`': 'backquote',
};

const MODIFIER_KEYS: Record<string, true> = { Control: true, Shift: true, Alt: true, Meta: true };

function keyName(event: KeyboardEvent): string | null {
    if (KEY_ALIASES[event.key]) {
        return KEY_ALIASES[event.key];
    }

    if (/^F\d{1,2}$/.test(event.key)) {
        return event.key.toLowerCase();
    }

    if (event.code.startsWith('Numpad')) {
        return event.code.toLowerCase();
    }

    if (event.key.length === 1) {
        return event.key.toLowerCase();
    }

    return null;
}

export function HotkeyField({ value, onChange }: { value: string; onChange: (value: string) => void }) {
    const { t } = useTranslation();
    const [listening, setListening] = useState(false);
    const [draft, setDraft] = useState(value);
    const box = useRef<HTMLButtonElement>(null);

    useEffect(() => {
        setDraft(value);
    }, [value]);

    useEffect(() => {
        if (!listening) {
            return;
        }

        const onKeyDown = (event: KeyboardEvent) => {
            event.preventDefault();
            event.stopPropagation();

            if (event.key === 'Escape') {
                setListening(false);
                return;
            }

            if (MODIFIER_KEYS[event.key]) {
                return;
            }

            const key = keyName(event);

            if (!key) {
                return;
            }

            const parts: string[] = [];

            if (event.ctrlKey) {
                parts.push('ctrl');
            }

            if (event.shiftKey) {
                parts.push('shift');
            }

            if (event.altKey) {
                parts.push('alt');
            }

            // The backend rejects a hotkey without a modifier.
            if (parts.length === 0) {
                return;
            }

            parts.push(key);

            const combo = parts.join('+');
            setDraft(combo);
            setListening(false);
            onChange(combo);
        };

        window.addEventListener('keydown', onKeyDown, true);

        return () => window.removeEventListener('keydown', onKeyDown, true);
    }, [listening, onChange]);

    return (
        <div className="field__inline">
            <button
                ref={box}
                type="button"
                className="code"
                style={{
                    flex: 1,
                    textAlign: 'left',
                    cursor: 'pointer',
                    borderColor: listening ? 'var(--accent-line)' : undefined,
                    color: draft ? 'var(--ink)' : 'var(--ink-3)',
                }}
                onClick={() => setListening((on) => !on)}
            >
                {listening ? t('settings.hotkey.listening') : draft || t('settings.hotkey.empty')}
            </button>

            {draft && (
                <button
                    type="button"
                    className="btn btn--ghost btn--sm"
                    onClick={() => {
                        setDraft('');
                        onChange('');
                    }}
                >
                    {t('settings.hotkey.clear')}
                </button>
            )}
        </div>
    );
}
