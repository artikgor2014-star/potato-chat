import type { Platform } from '@bindings/potato-chat/internal/chat/models.js';

import { ExpandForSettings, ShrinkToChat, Version } from '@bindings/potato-chat/app.js';
import { Events, Window } from '@wailsio/runtime';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';

import logo from '@/assets/potato.png';
import { ChatScreen } from '@/screens/Chat';
import { ConnectScreen } from '@/screens/Connect';
import { SettingsSheet } from '@/screens/Settings';
import { SourceScreen } from '@/screens/Source';
import { useAuthStore } from '@/stores/auth';
import { useConfigStore } from '@/stores/config';
import { useConnectionStore } from '@/stores/connection';
import { Icon } from '@/ui/Icon';
import { applyAppearance } from '@/utils/appearance';

type Screen = 'connect' | 'chat' | 'source';

// Wails delivers event payloads as `any`; narrow once at the boundary instead
// of asserting a shape at each read site.
function readPlatform(data: unknown): Platform | null {
    if (data && typeof data === 'object' && 'platform' in data) {
        const value = data.platform;

        return typeof value === 'string' ? (value as Platform) : null;
    }

    return null;
}

function readLogin(data: unknown): string {
    if (data && typeof data === 'object' && 'login' in data && typeof data.login === 'string') {
        return data.login;
    }

    return '';
}

function readReason(data: unknown): string {
    if (data && typeof data === 'object' && 'reason' in data && typeof data.reason === 'string') {
        return data.reason;
    }

    return '';
}

export default function App() {
    const { t } = useTranslation();
    const load = useConfigStore((s) => s.load);
    const loaded = useConfigStore((s) => s.loaded);
    const language = useConfigStore((s) => s.config?.general?.language);
    const appearance = useConfigStore((s) => s.config?.appearance);
    const setConnected = useConnectionStore((s) => s.setConnected);

    const seedAuth = useAuthStore((s) => s.seed);
    const setAuthPending = useAuthStore((s) => s.setPending);
    const setAuthConnected = useAuthStore((s) => s.setConnected);
    const setAuthLoggedOut = useAuthStore((s) => s.setLoggedOut);
    const setAuthError = useAuthStore((s) => s.setError);

    const [screen, setScreen] = useState<Screen>('connect');
    const [settingsOpen, setSettingsOpen] = useState(false);
    const [vanished, setVanished] = useState(false);
    const [authLogin, setAuthLogin] = useState('');
    const [buildVersion, setBuildVersion] = useState('');

    useEffect(() => {
        void load();
    }, [load]);

    useEffect(() => {
        void Version()
            .then((value) => setBuildVersion(value))
            .catch(() => setBuildVersion(''));
    }, []);

    useEffect(() => {
        const offConnected = Events.On('chat:connected', (event) => {
            const platform = readPlatform(event.data);

            if (platform) {
                setConnected(platform, true);
            }
        });

        const offDisconnected = Events.On('chat:disconnected', (event) => {
            const platform = readPlatform(event.data);

            if (platform) {
                setConnected(platform, false);
            }
        });

        return () => {
            offConnected();
            offDisconnected();
        };
    }, [setConnected]);

    useEffect(() => {
        void seedAuth();

        const offPending = Events.On('twitch:auth:pending', (event) => {
            setAuthPending(event.data as { userCode: string; verificationUri: string; expiresIn: number });
        });

        const offSuccess = Events.On('twitch:auth:success', (event) => {
            const login = readLogin(event.data);
            setAuthConnected(login);
            setAuthLogin(login);
        });

        const offError = Events.On('twitch:auth:error', (event) => {
            setAuthError(readReason(event.data));
        });

        const offLoggedOut = Events.On('twitch:auth:loggedout', () => {
            setAuthLoggedOut();
            setAuthLogin('');
        });

        return () => {
            offPending();
            offSuccess();
            offError();
            offLoggedOut();
        };
    }, [seedAuth, setAuthPending, setAuthConnected, setAuthError, setAuthLoggedOut]);

    useEffect(() => {
        const offVanish = Events.On('vanish:toggle', (event) => {
            setVanished(Boolean(event.data));
        });

        return () => {
            offVanish();
        };
    }, []);

    useEffect(() => {
        if (vanished) {
            document.documentElement.setAttribute('data-vanished', '');
        } else {
            document.documentElement.removeAttribute('data-vanished');
        }
    }, [vanished]);

    useEffect(() => {
        if (language) {
            void import('@/i18n').then(({ default: i18n }) => {
                if (language !== i18n.language) {
                    void i18n.changeLanguage(language);
                }
            });
        }
    }, [language]);

    useEffect(() => {
        applyAppearance(appearance);
    }, [appearance]);

    const toggleSettings = () => {
        if (settingsOpen) {
            void ShrinkToChat();
        } else {
            void ExpandForSettings();
        }

        setSettingsOpen((open) => !open);
    };

    if (!loaded) {
        return null;
    }

    return (
        <div
            className="shell"
            data-vanished={vanished || undefined}
        >
            <header className="bar">
                <div
                    className="bar__drag"
                    style={{ '--wails-draggable': 'drag' } as React.CSSProperties}
                >
                    <img
                        className="bar__logo"
                        src={logo}
                        alt=""
                    />
                    <span className="bar__name">Potato Chat</span>

                    {authLogin ? (
                        <span className="bar__live">{authLogin}</span>
                    ) : (
                        <span className="bar__ver">{buildVersion ? `v${buildVersion}` : ""}</span>
                    )}
                </div>

                <div className="bar__actions">
                    <button
                        className="iconbtn"
                        data-on={settingsOpen || undefined}
                        onClick={toggleSettings}
                        title={t('titlebar.settings')}
                        aria-label={t('titlebar.settings')}
                    >
                        <Icon
                            name="gear"
                            size={15}
                        />
                    </button>

                    <button
                        className="iconbtn"
                        onClick={() => void Window.Minimise()}
                        title={t('titlebar.minimize')}
                        aria-label={t('titlebar.minimize')}
                    >
                        <Icon
                            name="minimize"
                            size={15}
                        />
                    </button>

                    <button
                        className="iconbtn iconbtn--close"
                        onClick={() => void Window.Close()}
                        title={t('titlebar.close')}
                        aria-label={t('titlebar.close')}
                    >
                        <Icon
                            name="close"
                            size={15}
                        />
                    </button>
                </div>
            </header>

            {screen === 'connect' && <ConnectScreen onOpenChat={() => setScreen('chat')} />}
            {screen === 'chat' && (
                <ChatScreen
                    onBack={() => setScreen('connect')}
                    vanished={vanished}
                />
            )}
            {screen === 'source' && <SourceScreen onBack={() => setScreen('connect')} />}

            {settingsOpen && <SettingsSheet onClose={toggleSettings} />}
        </div>
    );
}
