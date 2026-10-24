import type { Appearance } from '@bindings/potato-chat/internal/config/models.js';
import type { Theme } from '@/types/theme';

import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { useConfigStore } from '@/stores/config';
import { BUILT_IN_THEMES, themeToCSS } from '@/types/theme';
import { Icon } from '@/ui/Icon';
import { Field, Row, Switch } from '@/ui/controls';
import { HotkeyField } from '@/ui/HotkeyField';
import { ACCENTS, ACCENT_COLORS } from '@/utils/appearance';
import { validateTwitchChannel } from '@/utils/validate';

export function GeneralTab() {
    const { t, i18n } = useTranslation();
    const config = useConfigStore((s) => s.config);
    const update = useConfigStore((s) => s.update);

    const appearance: Appearance | undefined = config?.appearance;
    const scale = appearance?.scale ?? 100;

    return (
        <>
            <div className="group">
                <span className="group__title">{t('settings.appearance.title')}</span>

                <div className="card">
                    <Field label={t('settings.general.accent')}>
                        <div className="swatches">
                            {ACCENTS.map((name) => (
                                <button
                                    key={name}
                                    type="button"
                                    className="swatch"
                                    data-on={(appearance?.accent ?? 'violet') === name}
                                    style={{ background: ACCENT_COLORS[name] }}
                                    aria-label={t(`settings.general.accents.${name}`)}
                                    title={t(`settings.general.accents.${name}`)}
                                    onClick={() => void update({ appearance: { accent: name } })}
                                />
                            ))}
                        </div>
                    </Field>

                    <Field
                        label={`${t('settings.general.ui_scale')} · ${scale}%`}
                        hint={t('settings.general.ui_scale_hint')}
                    >
                        <input
                            type="range"
                            min={90}
                            max={130}
                            step={5}
                            value={scale}
                            onChange={(e) => void update({ appearance: { scale: Number(e.target.value) } })}
                        />
                    </Field>

                    <Row
                        label={t('settings.general.compact')}
                        hint={t('settings.compact_hint')}
                    >
                        <Switch
                            checked={appearance?.compact ?? false}
                            onChange={(v) => void update({ appearance: { compact: v } })}
                        />
                    </Row>
                </div>
            </div>

            <div className="group">
                <span className="group__title">{t('settings.behaviour.title')}</span>

                <div className="card">
                    <Field label={t('settings.general.language')}>
                        <select
                            value={config?.general?.language ?? 'ru-RU'}
                            onChange={(e) => {
                                void i18n.changeLanguage(e.target.value);
                                void update({ general: { language: e.target.value } });
                            }}
                        >
                            <option value="ru-RU">Русский</option>
                            <option value="en-US">English</option>
                            <option value="de-DE">Deutsch</option>
                        </select>
                    </Field>

                    <Row label={t('settings.general.show_timestamps')}>
                        <Switch
                            checked={config?.general?.show_timestamps ?? false}
                            onChange={(v) => void update({ general: { show_timestamps: v } })}
                        />
                    </Row>

                    <Row label={t('settings.general.show_waiting_message')}>
                        <Switch
                            checked={config?.general?.show_waiting_message ?? true}
                            onChange={(v) => void update({ general: { show_waiting_message: v } })}
                        />
                    </Row>

                    <Row
                        label={t('settings.general.autostart')}
                        hint={t('settings.autostart_hint')}
                    >
                        <Switch
                            checked={config?.general?.autostart ?? false}
                            onChange={(v) => void update({ general: { autostart: v } })}
                        />
                    </Row>
                </div>
            </div>

            <div className="group">
                <span className="group__title">{t('settings.hotkey.title')}</span>

                <div className="card">
                    <Field
                        label={t('settings.general.vanish_hotkey')}
                        hint={t('settings.hotkey.hint')}
                    >
                        <HotkeyField
                            value={config?.keybinds?.vanish?.keybind ?? ''}
                            onChange={(v) => void update({ keybinds: { vanish: { keybind: v } } })}
                        />
                    </Field>
                </div>
            </div>
        </>
    );
}

export function ChannelTab() {
    const { t } = useTranslation();
    const config = useConfigStore((s) => s.config);
    const update = useConfigStore((s) => s.update);

    const [channel, setChannel] = useState(config?.twitch?.default_channel ?? '');
    const [saved, setSaved] = useState(false);

    useEffect(() => {
        setChannel(config?.twitch?.default_channel ?? '');
    }, [config?.twitch?.default_channel]);

    const invalid = validateTwitchChannel(channel);

    const commit = () => {
        if (invalid) {
            return;
        }

        void update({ twitch: { default_channel: channel.trim() } });
        setSaved(true);
        setTimeout(() => setSaved(false), 1400);
    };

    return (
        <>
            <div className="group">
                <span className="group__title">{t('settings.channel.title')}</span>

                <div className="card">
                    <Field
                        label={t('settings.platform.default_channel')}
                        hint={t('settings.channel.hint')}
                        error={invalid ? t(invalid) : null}
                    >
                        <div className="field__inline">
                            <input
                                type="text"
                                spellCheck={false}
                                value={channel}
                                onChange={(e) => setChannel(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && commit()}
                            />
                            <button
                                className="btn btn--primary btn--sm"
                                disabled={Boolean(invalid)}
                                onClick={commit}
                            >
                                {saved ? <Icon name="check" size={14} /> : t('settings.save')}
                            </button>
                        </div>
                    </Field>
                </div>
            </div>

            <div className="group">
                <span className="group__title">{t('settings.filters.title')}</span>

                <div className="card">
                    <Row label={t('settings.platform.fade')}>
                        <Switch
                            checked={config?.twitch?.fade ?? false}
                            onChange={(v) => void update({ twitch: { fade: v } })}
                        />
                    </Row>

                    {(config?.twitch?.fade ?? false) && (
                        <Field label={t('settings.platform.fade_timeout')}>
                            <input
                                type="number"
                                min={1}
                                max={300}
                                value={config?.twitch?.fade_timeout ?? 30}
                                onChange={(e) => void update({ twitch: { fade_timeout: Number(e.target.value) } })}
                            />
                        </Field>
                    )}

                    <Row label={t('settings.twitch.bots')}>
                        <Switch
                            checked={config?.twitch?.bots ?? false}
                            onChange={(v) => void update({ twitch: { bots: v } })}
                        />
                    </Row>

                    <Row label={t('settings.twitch.hide_commands')}>
                        <Switch
                            checked={config?.twitch?.hide_commands ?? false}
                            onChange={(v) => void update({ twitch: { hide_commands: v } })}
                        />
                    </Row>

                    <Row label={t('settings.twitch.hide_badges')}>
                        <Switch
                            checked={config?.twitch?.hide_badges ?? false}
                            onChange={(v) => void update({ twitch: { hide_badges: v } })}
                        />
                    </Row>

                    <Row label={t('settings.twitch.hide_gifs')}>
                        <Switch
                            checked={config?.twitch?.hide_gifs ?? false}
                            onChange={(v) => void update({ twitch: { hide_gifs: v } })}
                        />
                    </Row>
                </div>
            </div>

            <div className="group">
                <span className="group__title">{t('settings.events.title')}</span>

                <div className="card">
                    <span className="field__hint">{t('settings.twitch.events_hint')}</span>

                    {(
                        [
                            ['subscriptions', 'settings.twitch.events_subs'],
                            ['raids', 'settings.twitch.events_raids'],
                            ['announcements', 'settings.twitch.events_announcements'],
                            ['redemptions', 'settings.twitch.events_redemptions'],
                            ['other', 'settings.twitch.events_other'],
                        ] as const
                    ).map(([key, label]) => (
                        <Row
                            key={key}
                            label={t(label)}
                        >
                            <Switch
                                checked={config?.twitch?.events?.[key] ?? true}
                                onChange={(v) => void update({ twitch: { events: { [key]: v } } })}
                            />
                        </Row>
                    ))}
                </div>
            </div>
        </>
    );
}

export function ThemeTab() {
    const { t } = useTranslation();
    const config = useConfigStore((s) => s.config);
    const update = useConfigStore((s) => s.update);

    const activeId = config?.theme?.active_theme_id ?? 'default';
    const themes: Theme[] = [...BUILT_IN_THEMES, ...(config?.theme?.custom_themes ?? [])];

    return (
        <div className="group">
            <span className="group__title">{t('settings.themes.active_theme')}</span>

            <div className="themes">
                {themes.map((theme) => (
                    <button
                        key={theme.id}
                        type="button"
                        className="theme"
                        data-on={theme.id === activeId}
                        onClick={() => void update({ theme: { active_theme_id: theme.id } })}
                    >
                        <span className="theme__name">{theme.name}</span>
                        <span
                            className="theme__sample"
                            style={themeToCSS(theme) as React.CSSProperties}
                        >
                            {t('settings.themes.sample')}
                        </span>
                    </button>
                ))}
            </div>

            <span className="field__hint">{t('settings.themes.hint')}</span>
        </div>
    );
}
