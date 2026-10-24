import { ToggleVanish } from '@bindings/potato-chat/app.js';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';

import { useConfigStore } from '@/stores/config';
import { Icon } from '@/ui/Icon';

export function SourceScreen({ onBack }: { onBack: () => void }) {
    const { t } = useTranslation();
    const url = useConfigStore((s) => s.config?.custom_source?.url ?? '');
    const [reloadKey, setReloadKey] = useState(0);

    return (
        <div className="chat">
            <div className="chat__dock">
                <button
                    className="btn btn--quiet btn--sm"
                    onClick={onBack}
                >
                    <Icon
                        name="back"
                        size={14}
                    />
                    {t('chat.back')}
                </button>

                <div className="chat__grow" />

                <button
                    className="btn btn--quiet btn--sm"
                    title={t('chat.reload')}
                    onClick={() => setReloadKey((key) => key + 1)}
                >
                    <Icon
                        name="spark"
                        size={14}
                    />
                </button>

                <button
                    className="btn btn--quiet btn--sm"
                    title={t('chat.vanish')}
                    onClick={() => void ToggleVanish()}
                >
                    <Icon
                        name="eye"
                        size={14}
                    />
                </button>
            </div>

            {url ? (
                <iframe
                    key={reloadKey}
                    src={url}
                    title={t('home.custom_source.label')}
                    style={{
                        flex: 1,
                        width: '100%',
                        border: 0,
                        background: '#0b0812',
                    }}
                />
            ) : (
                <div className="chat__empty">
                    <Icon
                        name="globe"
                        size={20}
                    />
                    <span>{t('source.empty')}</span>
                </div>
            )}
        </div>
    );
}
