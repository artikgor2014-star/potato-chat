import type { ReactNode } from 'react';

/**
 * Single icon set for the whole interface. Paths are inlined so the app has no
 * icon-font or sprite dependency, and every icon inherits currentColor.
 */

export type IconName =
    | 'twitch'
    | 'youtube'
    | 'kick'
    | 'globe'
    | 'eye'
    | 'back'
    | 'gear'
    | 'minimize'
    | 'close'
    | 'copy'
    | 'check'
    | 'external'
    | 'down'
    | 'spark'
    | 'palette'
    | 'sliders'
    | 'layers'
    | 'broadcast'
    | 'monitor'
    | 'logout';

const PATHS: Record<IconName, ReactNode> = {
    twitch: <path d="M11.571 4.714h1.715v5.143H11.57zm4.715 0H18v5.143h-1.714zM6 0L1.714 4.286v15.428h5.143V24l4.286-4.286h3.428L22.286 12V0zm14.571 11.143l-3.428 3.428h-3.429l-3 3v-3H6.857V1.714h13.714z" />,
    youtube: (
        <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12z" />
    ),
    kick: (
        <path
            d="M37 .036h164.448v113.621h54.71v-56.82h54.731V.036h164.448v170.777h-54.73v56.82h-54.711v56.8h54.71v56.82h54.73V512.03H310.89v-56.82h-54.73v-56.8h-54.711v113.62H37V.036z"
            transform="scale(0.046875)"
        />
    ),
    globe: (
        <>
            <circle
                cx="12"
                cy="12"
                r="9"
            />
            <path d="M3 12h18M12 3c2.5 3 2.5 15 0 18M12 3c-2.5 3-2.5 15 0 18" />
        </>
    ),
    eye: (
        <>
            <path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7-10-7-10-7z" />
            <circle
                cx="12"
                cy="12"
                r="3"
            />
        </>
    ),
    back: <path d="M15 5l-7 7 7 7" />,
    gear: (
        <>
            <circle
                cx="12"
                cy="12"
                r="3"
            />
            <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.6 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.6a1.65 1.65 0 0 0 1-1.51V3a2 2 0 1 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9v.09a1.65 1.65 0 0 0 1.51 1H21a2 2 0 1 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
        </>
    ),
    minimize: <path d="M5 12h14" />,
    close: <path d="M6 6l12 12M18 6L6 18" />,
    copy: (
        <>
            <rect
                x="9"
                y="9"
                width="11"
                height="11"
                rx="2"
            />
            <path d="M5 15V5a2 2 0 0 1 2-2h10" />
        </>
    ),
    check: <path d="M4 12l5 5L20 6" />,
    external: <path d="M14 4h6v6M20 4l-9 9M19 14v5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1h5" />,
    down: <path d="M12 4v14M6 12l6 6 6-6" />,
    spark: <path d="M12 2l1.9 6.1L20 10l-6.1 1.9L12 18l-1.9-6.1L4 10l6.1-1.9z" />,
    palette: (
        <>
            <circle
                cx="12"
                cy="12"
                r="9"
            />
            <circle
                cx="9"
                cy="9"
                r="1.2"
            />
            <circle
                cx="15"
                cy="9"
                r="1.2"
            />
            <circle
                cx="9"
                cy="15"
                r="1.2"
            />
        </>
    ),
    sliders: <path d="M4 7h10M18 7h2M4 17h4M12 17h8M14 4v6M8 14v6" />,
    layers: <path d="M12 3l9 5-9 5-9-5 9-5zM3 13l9 5 9-5M3 17l9 5 9-5" />,
    broadcast: (
        <>
            <circle
                cx="12"
                cy="12"
                r="2.4"
            />
            <path d="M7.8 7.8a6 6 0 0 0 0 8.4M16.2 16.2a6 6 0 0 0 0-8.4M4.9 4.9a10 10 0 0 0 0 14.2M19.1 19.1a10 10 0 0 0 0-14.2" />
        </>
    ),
    monitor: (
        <>
            <rect
                x="3"
                y="4"
                width="18"
                height="12"
                rx="2"
            />
            <path d="M9 20h6M12 16v4" />
        </>
    ),
    logout: <path d="M15 4h4a1 1 0 0 1 1 1v14a1 1 0 0 1-1 1h-4M10 8l-4 4 4 4M6 12h10" />,
};

interface IconProps {
    name: IconName;
    size?: number;
    filled?: boolean;
    className?: string;
}

export function Icon({ name, size = 16, filled = false, className }: IconProps) {
    return (
        <svg
            width={size}
            height={size}
            viewBox="0 0 24 24"
            fill={filled ? 'currentColor' : 'none'}
            stroke={filled ? 'none' : 'currentColor'}
            strokeWidth={1.9}
            strokeLinecap="round"
            strokeLinejoin="round"
            className={className}
            aria-hidden="true"
        >
            {PATHS[name]}
        </svg>
    );
}
