import { useTranslation } from 'react-i18next';

import { Toggle } from '@/components/Toggle';
import { useConfigStore } from '@/stores/config';
import { ACCENTS, ACCENT_COLORS, MAX_SCALE, MIN_SCALE } from '@/utils/appearance';

import { HotkeyInput } from './HotkeyInput';

const languages = [
    { value: 'ru-RU', label: 'Русский' },
    { value: 'en-US', label: 'English' },
    { value: 'de-DE', label: 'Deutsch' },
];

export function GeneralSettings() {
    const { t, i18n } = useTranslation();
    const config = useConfigStore((s) => s.config);
    const update = useConfigStore((s) => s.update);

    const handleLanguageChange = (lang: string) => {
        void i18n.changeLanguage(lang);
        void update({ general: { language: lang } });
    };

    const accent = config?.appearance?.accent ?? 'violet';
    const scale = config?.appearance?.scale ?? 100;

    return (
        <>
            <div className="field-section">
                <span className="field-section-label">{t('settings.general.appearance')}</span>
            </div>

            <div className="field">
                <label className="field-label">{t('settings.general.accent')}</label>
                <div className="accent-swatches">
                    {ACCENTS.map((name) => (
                        <button
                            key={name}
                            type="button"
                            className={`accent-swatch ${accent === name ? 'active' : ''}`}
                            style={{ background: ACCENT_COLORS[name] }}
                            title={t(`settings.general.accents.${name}`)}
                            aria-label={t(`settings.general.accents.${name}`)}
                            onClick={() => void update({ appearance: { accent: name } })}
                        />
                    ))}
                </div>
            </div>

            <div className="field">
                <label className="field-label">
                    {t('settings.general.ui_scale')} — {scale}%
                </label>
                <input
                    type="range"
                    min={MIN_SCALE}
                    max={MAX_SCALE}
                    step={5}
                    value={scale}
                    onChange={(e) => void update({ appearance: { scale: Number(e.target.value) } })}
                />
                <span className="field-hint">{t('settings.general.ui_scale_hint')}</span>
            </div>

            <div className="field-row">
                <label className="field-label">{t('settings.general.compact')}</label>
                <Toggle
                    checked={config?.appearance?.compact ?? false}
                    onChange={(v) => void update({ appearance: { compact: v } })}
                />
            </div>

            <div className="field-section">
                <span className="field-section-label">{t('settings.general.behaviour')}</span>
            </div>

            <div className="field">
                <label className="field-label">{t('settings.general.language')}</label>
                <select
                    value={config?.general?.language ?? 'ru-RU'}
                    onChange={(e) => handleLanguageChange(e.target.value)}
                >
                    {languages.map((lang) => (
                        <option
                            key={lang.value}
                            value={lang.value}
                        >
                            {lang.label}
                        </option>
                    ))}
                </select>
            </div>

            <div className="field-row">
                <label className="field-label">{t('settings.general.show_timestamps')}</label>
                <Toggle
                    checked={config?.general?.show_timestamps ?? false}
                    onChange={(v) => void update({ general: { show_timestamps: v } })}
                />
            </div>

            <div className="field-row">
                <label className="field-label">{t('settings.general.show_waiting_message')}</label>
                <Toggle
                    checked={config?.general?.show_waiting_message ?? true}
                    onChange={(v) => void update({ general: { show_waiting_message: v } })}
                />
            </div>

            <div className="field-row">
                <label className="field-label">{t('settings.general.autostart')}</label>
                <Toggle
                    checked={config?.general?.autostart ?? false}
                    onChange={(v) => void update({ general: { autostart: v } })}
                />
            </div>

            <div className="field">
                <label className="field-label">{t('settings.general.vanish_hotkey')}</label>
                <HotkeyInput
                    value={config?.keybinds?.vanish?.keybind ?? ''}
                    onChange={(v) => void update({ keybinds: { vanish: { keybind: v } } })}
                />
            </div>
        </>
    );
}
