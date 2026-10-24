import { GetOverlayStatus, OpenOverlay, RestartOverlay } from '@bindings/potato-chat/app.js';
import type { OverlayStatus } from '@bindings/potato-chat/models.js';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { Toggle } from '@/components/Toggle';
import { useConfigStore } from '@/stores/config';

const DEFAULT_PORT = 8123;

export function OverlaySettings() {
    const { t } = useTranslation();
    const config = useConfigStore((s) => s.config);
    const update = useConfigStore((s) => s.update);

    const [status, setStatus] = useState<OverlayStatus | null>(null);
    const [port, setPort] = useState(String(config?.overlay?.port ?? DEFAULT_PORT));
    const [copied, setCopied] = useState(false);

    const enabled = config?.overlay?.enabled ?? false;
    const lan = config?.overlay?.lan ?? false;

    const refresh = async () => {
        try {
            setStatus(await GetOverlayStatus());
        } catch {
            setStatus(null);
        }
    };

    useEffect(() => {
        void refresh();
    }, [enabled, lan, config?.overlay?.port]);

    useEffect(() => {
        setPort(String(config?.overlay?.port ?? DEFAULT_PORT));
    }, [config?.overlay?.port]);

    const commitPort = () => {
        const value = Number(port);

        if (!Number.isInteger(value) || value < 1024 || value > 65535) {
            setPort(String(config?.overlay?.port ?? DEFAULT_PORT));
            return;
        }

        if (value !== config?.overlay?.port) {
            void update({ overlay: { port: value } });
        }
    };

    const copyURL = async () => {
        if (!status?.url) {
            return;
        }

        try {
            await navigator.clipboard.writeText(status.url);
            setCopied(true);
            setTimeout(() => setCopied(false), 1500);
        } catch {
            setCopied(false);
        }
    };

    return (
        <>
            <div className="field-row">
                <label className="field-label">{t('settings.overlay.enabled')}</label>
                <Toggle
                    checked={enabled}
                    onChange={(v) => void update({ overlay: { enabled: v } })}
                />
            </div>

            <span className="field-hint">{t('settings.overlay.enabled_hint')}</span>

            <div className="field">
                <label className="field-label">{t('settings.overlay.url')}</label>
                <div className="field-input-row">
                    <input
                        type="text"
                        readOnly
                        value={status?.url ?? t('settings.overlay.not_running')}
                    />
                    <button
                        className="btn btn-primary"
                        disabled={!status?.url}
                        onClick={() => void copyURL()}
                    >
                        {copied ? t('settings.overlay.copied') : t('settings.overlay.copy')}
                    </button>
                </div>
                <span className="field-hint">{t('settings.overlay.url_hint')}</span>
            </div>

            <div className="field">
                <label className="field-label">{t('settings.overlay.port')}</label>
                <div className="field-input-row">
                    <input
                        type="number"
                        min={1024}
                        max={65535}
                        value={port}
                        onChange={(e) => setPort(e.target.value)}
                        onBlur={commitPort}
                    />
                    <button
                        className="btn btn-ghost"
                        onClick={() => {
                            void RestartOverlay().then(setStatus);
                        }}
                    >
                        {t('settings.overlay.restart')}
                    </button>
                </div>
                <span className="field-hint">{t('settings.overlay.port_hint')}</span>
            </div>

            <div className="field-row">
                <label className="field-label">{t('settings.overlay.lan')}</label>
                <Toggle
                    checked={lan}
                    onChange={(v) => void update({ overlay: { lan: v } })}
                />
            </div>
            <span className="field-hint">{t('settings.overlay.lan_hint')}</span>

            <div className="field-section">
                <span className="field-section-label">{t('settings.overlay.obs')}</span>
            </div>
            <span className="field-hint">{t('settings.overlay.obs_steps')}</span>

            <div className="field-input-row">
                <button
                    className="btn btn-ghost"
                    disabled={!status?.url}
                    onClick={() => void OpenOverlay()}
                >
                    {t('settings.overlay.preview')}
                </button>
            </div>
        </>
    );
}
