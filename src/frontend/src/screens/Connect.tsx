import { Connect, Disconnect } from '@bindings/potato-chat/app.js';
import { Platform } from '@bindings/potato-chat/internal/chat/models.js';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';

import { useConfigStore } from '@/stores/config';
import { useConnectionStore } from '@/stores/connection';
import { Icon } from '@/ui/Icon';
import { Field, Segmented } from '@/ui/controls';
import { isValidSourceURL } from '@/utils/customSource';
import { validateKickChannel, validateTwitchChannel } from '@/utils/validate';

type PlatformKey = 'twitch' | 'youtube' | 'kick';

const PLATFORMS: { key: PlatformKey; platform: Platform; labelKey: string; placeholderKey: string }[] = [
    { key: 'twitch', platform: Platform.PlatformTwitch, labelKey: 'home.twitch', placeholderKey: 'home.placeholder.channel' },
    {
        key: 'youtube',
        platform: Platform.PlatformYouTube,
        labelKey: 'home.youtube',
        placeholderKey: 'home.placeholder.channel_or_url',
    },
    { key: 'kick', platform: Platform.PlatformKick, labelKey: 'home.kick', placeholderKey: 'home.placeholder.kick_channel' },
];

export function ConnectScreen({ onOpenChat }: { onOpenChat: () => void }) {
    const { t } = useTranslation();
    const config = useConfigStore((s) => s.config);
    const update = useConfigStore((s) => s.update);
    const { connected, inputs, setInput, setConnected } = useConnectionStore();

    const [active, setActive] = useState<PlatformKey>('twitch');
    const [busy, setBusy] = useState<PlatformKey | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [sourceURL, setSourceURL] = useState(config?.custom_source?.url ?? '');

    const current = PLATFORMS.find((p) => p.key === active) ?? PLATFORMS[0];

    const valueFor = (key: PlatformKey) => {
        const stored = inputs[PLATFORMS.find((p) => p.key === key)!.platform];

        if (stored) {
            return stored;
        }

        if (key === 'twitch') {
            return config?.twitch?.default_channel ?? '';
        }

        if (key === 'youtube') {
            return config?.youtube?.channel_id ?? '';
        }

        return config?.kick?.default_channel ?? '';
    };

    const validationFor = (key: PlatformKey) => {
        const value = valueFor(key).trim();

        if (key === 'twitch') {
            return validateTwitchChannel(value);
        }

        if (key === 'kick') {
            return validateKickChannel(value);
        }

        return null;
    };

    const connect = async (entry: (typeof PLATFORMS)[number]) => {
        setError(null);
        setBusy(entry.key);

        try {
            await Connect(entry.platform, valueFor(entry.key));
            setConnected(entry.platform, true);
        } catch (err) {
            setError(String(err));
        } finally {
            setBusy(null);
        }
    };

    const disconnect = async (entry: (typeof PLATFORMS)[number]) => {
        await Disconnect(entry.platform);
        setConnected(entry.platform, false);
    };

    const openSource = async () => {
        await update({ custom_source: { url: sourceURL } }, { silent: true });
        window.location.hash = '#/source';
    };

    const online = PLATFORMS.filter((p) => connected[p.platform]);
    const activeConnected = Boolean(connected[current.platform]);

    return (
        <div className="screen">
            <header className="hero">
                <span className="hero__eyebrow">{t('connect.eyebrow')}</span>
                <h1 className="hero__title">{t('connect.title')}</h1>
                <p className="hero__sub">{t('connect.subtitle')}</p>
            </header>

            <section className="panel">
                <div className="panel__head">
                    <span className="panel__title">{t('connect.pick')}</span>
                    <Segmented
                        value={active}
                        onChange={setActive}
                        options={PLATFORMS.map((p) => ({
                            value: p.key,
                            label: t(p.labelKey),
                            icon: <Icon name={p.key} size={13} filled={p.key !== 'youtube'} />,
                        }))}
                    />
                </div>

                <div className="inline">
                    <input
                        type="text"
                        spellCheck={false}
                        placeholder={t(current.placeholderKey)}
                        value={valueFor(active)}
                        onChange={(e) => {
                            setInput(current.platform, e.target.value);
                            setError(null);
                        }}
                        onKeyDown={(e) => {
                            if (e.key === 'Enter' && valueFor(active).trim()) {
                                void (activeConnected ? disconnect(current) : connect(current));
                            }
                        }}
                    />
                    <button
                        className={`btn ${activeConnected ? 'btn--danger' : 'btn--primary'}`}
                        disabled={!valueFor(active).trim() || busy !== null}
                        onClick={() => void (activeConnected ? disconnect(current) : connect(current))}
                    >
                        {busy === active ? t('home.connecting') : activeConnected ? t('home.disconnect') : t('home.connect')}
                    </button>
                </div>

                {validationFor(active) && <span className="field__err">{t(validationFor(active)!)}</span>}
                {error && <span className="field__err">{error}</span>}

                <span className="field__hint">{t('connect.anonymous')}</span>
            </section>

            {online.length > 0 && (
                <section className="panel panel--tight">
                    <div className="panel__head">
                        <span className="panel__title">{t('connect.online')}</span>
                        <span className="chip">{online.length}</span>
                    </div>

                    {online.map((entry) => (
                        <div
                            key={entry.key}
                            className="rowline"
                        >
                            <span className="rowline__key">
                                <Icon
                                    name={entry.key}
                                    size={13}
                                    filled={entry.key !== 'youtube'}
                                />
                                {valueFor(entry.key)}
                            </span>
                            <button
                                className="btn btn--quiet btn--sm"
                                onClick={() => void disconnect(entry)}
                            >
                                {t('home.disconnect')}
                            </button>
                        </div>
                    ))}
                </section>
            )}

            <section className="panel">
                <div className="panel__head">
                    <span className="panel__title">{t('home.custom_source.label')}</span>
                    <Icon
                        name="globe"
                        size={14}
                    />
                </div>
                <Field
                    label={t('connect.source_label')}
                    hint={t('home.custom_source.hint')}
                >
                    <input
                        type="url"
                        spellCheck={false}
                        placeholder={t('home.custom_source.placeholder')}
                        value={sourceURL}
                        onChange={(e) => setSourceURL(e.target.value)}
                    />
                </Field>
                <button
                    className="btn btn--ghost"
                    disabled={!isValidSourceURL(sourceURL)}
                    onClick={() => void openSource()}
                >
                    <Icon
                        name="external"
                        size={14}
                    />
                    {t('home.custom_source.open')}
                </button>
            </section>

            <div className="launch">
                <button
                    className="btn btn--primary btn--block"
                    disabled={online.length === 0}
                    onClick={onOpenChat}
                >
                    {t('home.open_chat')}
                    <Icon
                        name="down"
                        size={15}
                    />
                </button>
                <span className="launch__hint">{t('connect.launch_hint')}</span>
            </div>
        </div>
    );
}
