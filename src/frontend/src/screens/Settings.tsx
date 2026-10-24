import type { IconName } from '@/ui/Icon';

import { useState } from 'react';
import { useTranslation } from 'react-i18next';

import { useConfigStore } from '@/stores/config';
import { Icon } from '@/ui/Icon';
import { ChannelTab, GeneralTab, ThemeTab } from './settings/GeneralTabs';
import { OverlayTab } from './settings/OverlayTab';

const TABS = [
    { key: 'general', icon: 'sliders', label: 'settings.tabs.general' },
    { key: 'channel', icon: 'broadcast', label: 'settings.tabs.channel' },
    { key: 'overlay', icon: 'layers', label: 'settings.tabs.overlay' },
    { key: 'themes', icon: 'palette', label: 'settings.tabs.themes' },
] as const satisfies readonly { key: string; icon: IconName; label: string }[];

type TabKey = (typeof TABS)[number]['key'];

export function SettingsSheet({ onClose }: { onClose: () => void }) {
    const { t } = useTranslation();
    const saved = useConfigStore((s) => s.saved);
    const [tab, setTab] = useState<TabKey>('general');

    return (
        <div className="sheet">
            <div className="sheet__bar">
                <span className="sheet__title">{t('titlebar.settings')}</span>
                <div className="chat__grow" />
                <button
                    className="iconbtn"
                    onClick={onClose}
                    aria-label={t('titlebar.close')}
                >
                    <Icon
                        name="close"
                        size={15}
                    />
                </button>
            </div>

            <nav className="sheet__tabs">
                {TABS.map((entry) => (
                    <button
                        key={entry.key}
                        className="tab"
                        data-on={tab === entry.key}
                        onClick={() => setTab(entry.key)}
                    >
                        <Icon
                            name={entry.icon}
                            size={13}
                        />
                        {t(entry.label)}
                    </button>
                ))}
            </nav>

            <div className="sheet__body">
                {tab === 'general' && <GeneralTab />}
                {tab === 'channel' && <ChannelTab />}
                {tab === 'overlay' && <OverlayTab />}
                {tab === 'themes' && <ThemeTab />}
            </div>

            {saved && <span className="chip">{t('settings.saved')}</span>}
        </div>
    );
}
