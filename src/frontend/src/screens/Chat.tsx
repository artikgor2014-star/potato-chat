import type { ChatMessage } from '@/types/chat';

import { ToggleVanish } from '@bindings/potato-chat/app.js';
import { Platform } from '@bindings/potato-chat/internal/chat/models.js';
import { Events } from '@wailsio/runtime';
import { useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { Message } from '@/ui/Message';
import { fadePolicy, shouldDisplay } from '@/filter/messageFilter';
import { useConfigStore } from '@/stores/config';
import { useConnectionStore } from '@/stores/connection';
import { getThemeById, themeToCSS } from '@/types/theme';
import { Icon } from '@/ui/Icon';

const LIMIT = 400;

export function ChatScreen({ onBack, vanished }: { onBack: () => void; vanished: boolean }) {
    const { t } = useTranslation();
    const config = useConfigStore((s) => s.config);
    const connected = useConnectionStore((s) => s.connected);

    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [pinned, setPinned] = useState(true);
    const [only, setOnly] = useState<Platform | null>(null);

    const stream = useRef<HTMLDivElement>(null);
    const pinnedRef = useRef(true);
    const scrollingRef = useRef(false);

    const theme = getThemeById(config?.theme?.active_theme_id ?? 'default', config?.theme?.custom_themes ?? []);
    const topToBottom = Boolean(theme.top_to_bottom);

    const online = useMemo(
        () => [Platform.PlatformTwitch, Platform.PlatformYouTube, Platform.PlatformKick].filter((p) => connected[p]),
        [connected]
    );

    useEffect(() => {
        const offMessage = Events.On('chat:message', (event) => {
            const incoming = event.data as ChatMessage;

            if (!shouldDisplay(incoming, useConfigStore.getState().config)) {
                return;
            }

            setMessages((prev) => (prev.length >= LIMIT ? [...prev.slice(prev.length - LIMIT + 1), incoming] : [...prev, incoming]));
        });

        const offClear = Events.On('chat:clear', (event) => {
            const user = String(event.data).toLowerCase();
            setMessages((prev) => prev.filter((m) => m.username.toLowerCase() !== user));
        });

        const offDelete = Events.On('chat:delete-message', (event) => {
            const id = String(event.data);
            setMessages((prev) => prev.filter((m) => m.id !== id));
        });

        return () => {
            offMessage();
            offClear();
            offDelete();
        };
    }, []);

    useEffect(() => {
        const el = stream.current;

        if (!el || !pinnedRef.current || scrollingRef.current) {
            return;
        }

        el.scrollTop = topToBottom ? 0 : el.scrollHeight;
    }, [messages, topToBottom]);

    useEffect(() => {
        const el = stream.current;

        if (!el) {
            return;
        }

        let release: number | undefined;

        const onWheel = (event: WheelEvent) => {
            const away = topToBottom ? event.deltaY > 0 : event.deltaY < 0;

            if (!away) {
                return;
            }

            pinnedRef.current = false;
            setPinned(false);
            scrollingRef.current = true;

            window.clearTimeout(release);
            release = window.setTimeout(() => {
                scrollingRef.current = false;
            }, 150);
        };

        el.addEventListener('wheel', onWheel, { passive: true });

        return () => {
            el.removeEventListener('wheel', onWheel);
            window.clearTimeout(release);
        };
    }, [topToBottom]);

    const onScroll = () => {
        const el = stream.current;

        if (!el) {
            return;
        }

        const atEdge = topToBottom ? el.scrollTop < 40 : el.scrollHeight - el.scrollTop - el.clientHeight < 40;

        if (atEdge && !pinnedRef.current) {
            pinnedRef.current = true;
            setPinned(true);
        }
    };

    const visible = messages.filter((m) => (only ? m.platform === only : true));
    const ordered = topToBottom ? [...visible].reverse() : visible;

    return (
        <div className="chat">
            {!vanished && (
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

                    {online.length > 1 &&
                        online.map((platform) => (
                            <button
                                key={platform}
                                className="seg__item"
                                data-on={only === platform}
                                title={platform}
                                onClick={() => setOnly(only === platform ? null : platform)}
                            >
                                <Icon
                                    name={platform === Platform.PlatformTwitch ? 'twitch' : platform === Platform.PlatformYouTube ? 'youtube' : 'kick'}
                                    size={12}
                                    filled={platform !== Platform.PlatformYouTube}
                                />
                            </button>
                        ))}

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
            )}

            <div
                ref={stream}
                className={`chat__stream${vanished ? ' chat__stream--bare' : ''}`}
                data-top={topToBottom}
                style={themeToCSS(theme) as React.CSSProperties}
                onScroll={onScroll}
            >
                {ordered.length === 0 ? (
                    config?.general?.show_waiting_message !== false && (
                        <div className="chat__empty">
                            <Icon
                                name="spark"
                                size={20}
                            />
                            <span>{t('chat.waiting')}</span>
                        </div>
                    )
                ) : (
                    ordered.map((message) => {
                        const { fade, timeoutSeconds } = fadePolicy(message.platform, config);

                        return (
                            <Message
                                key={message.id}
                                message={message}
                                showTime={config?.general?.show_timestamps ?? false}
                                hideBadges={config?.twitch?.hide_badges ?? false}
                                hideGifs={config?.twitch?.hide_gifs ?? false}
                                showAvatars={Boolean(theme.show_avatars)}
                                showPlatform={online.length > 1}
                                showColon={theme.show_colon}
                                fade={fade}
                                fadeAfter={timeoutSeconds}
                                onFaded={(id) => setMessages((prev) => prev.filter((m) => m.id !== id))}
                            />
                        );
                    })
                )}
            </div>

            {!pinned && (
                <button
                    className="chat__jump"
                    onClick={() => {
                        pinnedRef.current = true;
                        setPinned(true);
                        stream.current?.scrollTo({
                            top: topToBottom ? 0 : stream.current.scrollHeight,
                            behavior: 'smooth',
                        });
                    }}
                >
                    {topToBottom ? t('chat.scroll_to_top') : t('chat.scroll_to_bottom')}
                </button>
            )}
        </div>
    );
}
