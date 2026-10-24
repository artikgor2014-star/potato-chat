import type { ReactNode } from 'react';

export function Switch({ checked, onChange, label }: { checked: boolean; onChange: (v: boolean) => void; label?: string }) {
    return (
        <button
            type="button"
            className="sw"
            data-on={checked}
            role="switch"
            aria-checked={checked}
            aria-label={label}
            onClick={() => onChange(!checked)}
        />
    );
}

export function Row({ label, hint, children }: { label: string; hint?: string; children: ReactNode }) {
    return (
        <div className="field__row">
            <div>
                <div className="field__label">{label}</div>
                {hint && <div className="field__hint">{hint}</div>}
            </div>
            {children}
        </div>
    );
}

export function Field({ label, hint, error, children }: { label: string; hint?: string; error?: string | null; children: ReactNode }) {
    return (
        <div className="field">
            <span className="field__label">{label}</span>
            {children}
            {error ? <span className="field__error">{error}</span> : hint ? <span className="field__hint">{hint}</span> : null}
        </div>
    );
}

export function Segmented<T extends string>({
    value,
    options,
    onChange,
}: {
    value: T;
    options: { value: T; label: string; icon?: ReactNode }[];
    onChange: (v: T) => void;
}) {
    return (
        <div className="seg" role="tablist">
            {options.map((option) => (
                <button
                    key={option.value}
                    type="button"
                    role="tab"
                    aria-selected={value === option.value}
                    className="seg__item"
                    data-on={value === option.value}
                    onClick={() => onChange(option.value)}
                >
                    {option.icon}
                    {option.label}
                </button>
            ))}
        </div>
    );
}
