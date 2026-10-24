import type { ChatMessage } from '@/types/chat';

import { Events } from '@wailsio/runtime';
import { useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { useConfigStore } from '@/stores/config';
import { Icon } from '@/ui/Icon';

const MAX_RECENT = 30;

/** Stable hue per nickname, so the same follower always gets the same colour. */
function hueOf(name: string): number {
    let hash = 0;

    for (let i = 0; i < name.length; i += 1) {
        hash = (hash * 31 + name.charCodeAt(i)) % 360;
    }

    return hash;
}

function initials(name: string): string {
    const trimmed = name.trim();

    if (trimmed.length === 0) {
        return '?';
    }

    return trimmed.slice(0, 2).toUpperCase();
}

function clock(timestamp: string): string {
    const date = new Date(timestamp);

    if (Number.isNaN(date.getTime())) {
        return '';
    }

    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

export function FollowersScreen({ onBack, vanished }: { onBack: () => void; vanished: boolean }) {
    const { t } = useTranslation();
    const config = useConfigStore((s) => s.config);

    const [followers, setFollowers] = useState<ChatMessage[]>([]);
    const [flash, setFlash] = useState<string | null>(null);
    const timer = useRef<number | undefined>(undefined);

    const duration = config?.followers?.duration ?? 8;

    useEffect(() => {
        const off = Events.On('chat:message', (event) => {
            const message = event.data as ChatMessage;

            if (message.eventType !== 'follow') {
                return;
            }

            setFollowers((prev) => [message, ...prev.filter((f) => f.username !== message.username)].slice(0, MAX_RECENT));
            setFlash(message.id);

            window.clearTimeout(timer.current);
            timer.current = window.setTimeout(() => setFlash(null), duration * 1000);
        });

        return () => {
            off();
            window.clearTimeout(timer.current);
        };
    }, [duration]);

    const latest = followers[0];
    const rest = followers.slice(1);

    const headline = useMemo(() => {
        if (!latest) {
            return null;
        }

        return (
            <div
                key={latest.id}
                className="follow-card"
                style={{ '--follow-hue': hueOf(latest.username) } as React.CSSProperties}
            >
                <span className="follow-card__ring" />
                <span className="follow-card__avatar">{initials(latest.username)}</span>
                <span className="follow-card__text">
                    <span className="follow-card__label">{t('followers.new')}</span>
                    <span className="follow-card__name">{latest.username}</span>
                </span>
            </div>
        );
    }, [latest, t]);

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

                    <span className="chip chip--muted">
                        {followers.length > 0 ? followers.length : 0} {t('followers.count')}
                    </span>
                </div>
            )}

            <div className={`chat__stream followers${vanished ? ' chat__stream--bare' : ''}`}>
                {!latest ? (
                    <div className="chat__empty">
                        <Icon
                            name="spark"
                            size={20}
                        />
                        <span>{t('followers.waiting')}</span>
                    </div>
                ) : (
                    <>
                        <div className={flash ? 'follow-live' : 'follow-live follow-live--settled'}>{headline}</div>

                        {!vanished && rest.length > 0 && (
                            <ul className="follow-list">
                                {rest.map((follower) => (
                                    <li
                                        key={follower.id}
                                        className="follow-list__item"
                                    >
                                        <span
                                            className="follow-list__avatar"
                                            style={{ '--follow-hue': hueOf(follower.username) } as React.CSSProperties}
                                        >
                                            {initials(follower.username)}
                                        </span>
                                        <span className="follow-list__name">{follower.username}</span>
                                        <span className="follow-list__time">{clock(follower.timestamp)}</span>
                                    </li>
                                ))}
                            </ul>
                        )}
                    </>
                )}
            </div>
        </div>
    );
}
