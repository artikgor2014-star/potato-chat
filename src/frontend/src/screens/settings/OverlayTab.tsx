import type { OverlayStatus } from '@bindings/potato-chat/models.js';

import { GetOverlayStatus, OpenOverlay, RestartOverlay } from '@bindings/potato-chat/app.js';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { useConfigStore } from '@/stores/config';
import { Icon } from '@/ui/Icon';
import { Field, Row, Switch } from '@/ui/controls';

const FALLBACK_PORT = 8123;

export function OverlayTab() {
    const { t } = useTranslation();
    const config = useConfigStore((s) => s.config);
    const update = useConfigStore((s) => s.update);

    const [status, setStatus] = useState<OverlayStatus | null>(null);
    const [port, setPort] = useState(String(config?.overlay?.port ?? FALLBACK_PORT));
    const [copied, setCopied] = useState(false);

    const enabled = config?.overlay?.enabled ?? false;
    const lan = config?.overlay?.lan ?? false;
    const savedPort = config?.overlay?.port ?? FALLBACK_PORT;

    useEffect(() => {
        let live = true;

        void GetOverlayStatus()
            .then((value) => {
                if (live) {
                    setStatus(value);
                }
            })
            .catch(() => {
                if (live) {
                    setStatus(null);
                }
            });

        return () => {
            live = false;
        };
    }, [enabled, lan, savedPort]);

    useEffect(() => {
        setPort(String(savedPort));
    }, [savedPort]);

    const commitPort = () => {
        const next = Number(port);

        if (!Number.isInteger(next) || next < 1024 || next > 65535) {
            setPort(String(savedPort));
            return;
        }

        if (next !== savedPort) {
            void update({ overlay: { port: next } });
        }
    };

    const copy = async () => {
        if (!status?.url) {
            return;
        }

        try {
            await navigator.clipboard.writeText(status.url);
            setCopied(true);
            window.setTimeout(() => setCopied(false), 1500);
        } catch {
            setCopied(false);
        }
    };

    return (
        <>
            <div className="group">
                <span className="group__title">{t('settings.overlay.title')}</span>

                <div className="card">
                    <Row
                        label={t('settings.overlay.enabled')}
                        hint={t('settings.overlay.enabled_hint')}
                    >
                        <Switch
                            checked={enabled}
                            onChange={(v) => void update({ overlay: { enabled: v } })}
                        />
                    </Row>

                    <div className="rowline">
                        <span className="rowline__key">{t('settings.overlay.state')}</span>
                        <span className="rowline__val">
                            {status?.running ? (
                                <span className="chip">
                                    <span className="dot" data-on="true" />
                                    {t('settings.overlay.running')}
                                </span>
                            ) : (
                                <span className="chip chip--muted">{t('settings.overlay.stopped')}</span>
                            )}
                        </span>
                    </div>
                </div>
            </div>

            <div className="group">
                <span className="group__title">{t('settings.overlay.url')}</span>

                <div className="card">
                    <div className="code">{status?.url ?? t('settings.overlay.not_running')}</div>

                    <div className="field__inline">
                        <button
                            className="btn btn--primary btn--sm"
                            disabled={!status?.url}
                            onClick={() => void copy()}
                        >
                            <Icon
                                name={copied ? 'check' : 'copy'}
                                size={14}
                            />
                            {copied ? t('settings.overlay.copied') : t('settings.overlay.copy')}
                        </button>

                        <button
                            className="btn btn--ghost btn--sm"
                            disabled={!status?.url}
                            onClick={() => void OpenOverlay()}
                        >
                            <Icon
                                name="external"
                                size={14}
                            />
                            {t('settings.overlay.preview')}
                        </button>
                    </div>

                    <span className="field__hint">{t('settings.overlay.url_hint')}</span>
                </div>
            </div>

            <div className="group">
                <span className="group__title">{t('settings.overlay.advanced')}</span>

                <div className="card">
                    <Field
                        label={t('settings.overlay.port')}
                        hint={t('settings.overlay.port_hint')}
                    >
                        <div className="field__inline">
                            <input
                                type="number"
                                min={1024}
                                max={65535}
                                value={port}
                                onChange={(e) => setPort(e.target.value)}
                                onBlur={commitPort}
                            />
                            <button
                                className="btn btn--ghost btn--sm"
                                onClick={() => {
                                    void RestartOverlay().then(setStatus);
                                }}
                            >
                                {t('settings.overlay.restart')}
                            </button>
                        </div>
                    </Field>

                    <Row
                        label={t('settings.overlay.lan')}
                        hint={t('settings.overlay.lan_hint')}
                    >
                        <Switch
                            checked={lan}
                            onChange={(v) => void update({ overlay: { lan: v } })}
                        />
                    </Row>
                </div>
            </div>

            <div className="card card--flat">
                <div className="rowline">
                    <span className="rowline__key">
                        <Icon
                            name="monitor"
                            size={13}
                        />{' '}
                        OBS
                    </span>
                    <span className="rowline__val">{t('settings.overlay.obs_size')}</span>
                </div>
                <span className="field__hint">{t('settings.overlay.obs_steps')}</span>
            </div>
        </>
    );
}
