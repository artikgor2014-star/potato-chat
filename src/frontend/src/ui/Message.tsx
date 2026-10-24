import type { ChatMessage } from '@/types/chat';

import { useEffect, useState } from 'react';

interface MessageProps {
    message: ChatMessage;
    showTime: boolean;
    hideBadges: boolean;
    hideGifs: boolean;
    showAvatars: boolean;
    showPlatform: boolean;
    showColon: boolean;
    fade: boolean;
    fadeAfter: number;
    onFaded: (id: string) => void;
}

function timeOf(timestamp: string): string {
    const date = new Date(timestamp);

    if (Number.isNaN(date.getTime())) {
        return '';
    }

    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

/** Shared fade timer: mark the row, then let the parent drop it. */
function useFade(id: string, fade: boolean, fadeAfter: number, onFaded: (id: string) => void) {
    const [out, setOut] = useState(false);

    useEffect(() => {
        if (!fade) {
            return;
        }

        const timer = window.setTimeout(() => {
            setOut(true);
            window.setTimeout(() => onFaded(id), 480);
        }, fadeAfter * 1000);

        return () => window.clearTimeout(timer);
    }, [id, fade, fadeAfter, onFaded]);

    return out;
}

function EventRow({ message, fade, fadeAfter, onFaded }: Pick<MessageProps, 'message' | 'fade' | 'fadeAfter' | 'onFaded'>) {
    const out = useFade(message.id, fade, fadeAfter, onFaded);

    return (
        <div
            className="msg msg--event"
            data-out={out}
        >
            {message.systemMessage || message.text}
        </div>
    );
}

export function Message(props: MessageProps) {
    const { message, showTime, hideBadges, hideGifs, showAvatars, showPlatform, showColon, fade, fadeAfter, onFaded } = props;
    const out = useFade(message.id, fade, fadeAfter, onFaded);

    if (message.eventType || message.systemMessage) {
        return (
            <EventRow
                message={message}
                fade={fade}
                fadeAfter={fadeAfter}
                onFaded={onFaded}
            />
        );
    }

    const parts = message.fragments ?? [];

    return (
        <div
            className={`msg${message.isAction ? ' msg--action' : ''}`}
            data-out={out}
        >
            {showTime && <span className="msg__time">{timeOf(message.timestamp)}</span>}

            {showAvatars && message.avatar && (
                <img
                    className="msg__avatar"
                    src={message.avatar}
                    alt=""
                    loading="lazy"
                />
            )}

            {!hideBadges && message.badges?.length > 0 && (
                <span className="msg__badges">
                    {message.badges.map((badge, index) =>
                        badge.url ? (
                            <img
                                key={`${badge.name}-${badge.version}-${index}`}
                                className="msg__badge"
                                src={badge.url}
                                alt={badge.name}
                                loading="lazy"
                            />
                        ) : null
                    )}
                </span>
            )}

            <span
                className="msg__user"
                style={{ '--user-color': message.color || undefined } as React.CSSProperties}
            >
                {showPlatform && (
                    <span className="msg__plat">
                        {message.platform === 'twitch' ? 'T' : message.platform === 'youtube' ? 'YT' : 'K'}
                    </span>
                )}
                {message.username}
            </span>

            {showColon && <span className="msg__colon">:</span>}

            <span>
                {parts.length === 0 && message.text}

                {parts.map((part, index) => {
                    if (part.type === 'emote' && part.url) {
                        return (
                            <img
                                key={index}
                                className="msg__emote"
                                src={part.url}
                                alt={part.text}
                                loading="lazy"
                            />
                        );
                    }

                    if (part.type === 'gif' && part.url) {
                        return hideGifs ? null : (
                            <img
                                key={index}
                                className="msg__gif"
                                src={part.url}
                                alt={part.text}
                                loading="lazy"
                            />
                        );
                    }

                    return <span key={index}>{part.text}</span>;
                })}
            </span>
        </div>
    );
}
