import { Browser } from '@wailsio/runtime';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';

import { useConfigStore } from '@/stores/config';

import { GeneralSettings } from './GeneralSettings';
import { KickSettings } from './KickSettings';
import { OverlaySettings } from './OverlaySettings';
import styles from './Settings.module.css';
import { ThemeSettings } from './ThemeSettings';
import { TwitchSettings } from './TwitchSettings';
import { YouTubeSettings } from './YouTubeSettings';

const tabKeys = ['general', 'overlay', 'twitch', 'youtube', 'kick', 'themes'] as const;
type Tab = (typeof tabKeys)[number];

export function Settings({ onTabChange }: { onTabChange?: (tab: string) => void }) {
    const [activeTab, setActiveTab] = useState<Tab>('general');
    const { t } = useTranslation();
    const config = useConfigStore((s) => s.config);
    const saved = useConfigStore((s) => s.saved);

    if (!config) {
        return null;
    }

    return (
        <div className={styles.settings}>
            <nav className={styles.sidebar}>
                {tabKeys.map((key) => (
                    <button
                        key={key}
                        className={`${styles.tab} ${activeTab === key ? styles.active : ''}`}
                        onClick={() => {
                            setActiveTab(key);
                            onTabChange?.(key);
                        }}
                    >
                        {t(`settings.tabs.${key}`)}
                    </button>
                ))}
                <div className={styles.supportLinks}>
                    <span className={styles.supportText}>{t('settings.support')}</span>
                    <button
                        className={styles.supportLink}
                        onClick={() => void Browser.OpenURL('https://github.com/Enubia/ghost-chat')}
                        style={{ background: 'rgba(145, 70, 255, 0.15)', color: '#b18cff' }}
                    >
                        Ghost Chat
                    </button>
                </div>
            </nav>
            <div className={styles.content}>
                {activeTab === 'general' && <GeneralSettings />}
                {activeTab === 'overlay' && <OverlaySettings />}
                {activeTab === 'twitch' && <TwitchSettings />}
                {activeTab === 'youtube' && <YouTubeSettings />}
                {activeTab === 'kick' && <KickSettings />}
                {activeTab === 'themes' && <ThemeSettings />}
            </div>
            {saved && <span className={styles.saved}>Saved</span>}
        </div>
    );
}
