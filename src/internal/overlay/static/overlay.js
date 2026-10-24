// Browser-source overlay: renders chat pushed over Server-Sent Events.
// Mirrors the theme variables of the app window so both views look identical.

const MAX_MESSAGES = 200;
const REF_FONT_SIZE = 14;

const state = {
    theme: null,
    twitch: null,
    showTimestamps: false,
};

const list = document.getElementById('messages');

function px(value, fallback) {
    return `${value || fallback}px`;
}

function applyTheme(theme) {
    const root = document.documentElement.style;

    root.setProperty('--theme-font-family', theme.font_family || 'inherit');
    root.setProperty('--theme-font-size', px(theme.font_size, 16));
    root.setProperty('--theme-line-height', String(theme.line_height || 1.6));
    root.setProperty('--theme-message-bg', theme.message_bg || 'transparent');
    root.setProperty('--theme-message-padding', theme.message_padding || '2px 0');
    root.setProperty('--theme-message-radius', px(theme.message_radius, 0));
    root.setProperty('--theme-message-gap', px(theme.message_gap, 0));
    root.setProperty('--theme-username-weight', String(theme.username_weight || 600));
    root.setProperty('--theme-text-weight', String(theme.text_weight || 400));
    root.setProperty('--theme-text-shadow', theme.text_shadow || 'none');
    root.setProperty('--theme-text-color', theme.text_color || '#ffffff');
    root.setProperty(
        '--theme-text-stroke',
        theme.text_stroke_width ? `${theme.text_stroke_width}px ${theme.text_stroke_color}` : '0',
    );

    // Sizes are authored against a 14px reference and scale with the font size.
    const scale = (theme.font_size || REF_FONT_SIZE) / REF_FONT_SIZE;
    root.setProperty('--theme-badge-size', `${(theme.badge_size || 18) * scale}px`);
    root.setProperty('--theme-emote-size', `${(theme.emote_size || 28) * scale}px`);
    root.setProperty('--theme-gif-size', `${(theme.gif_size || 112) * scale}px`);

    list.classList.toggle('top-to-bottom', Boolean(theme.top_to_bottom));
}

function formatTime(timestamp) {
    const date = new Date(timestamp);
    if (Number.isNaN(date.getTime())) {
        return '';
    }

    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

function buildBadges(message) {
    if (state.twitch?.hide_badges || !Array.isArray(message.badges) || message.badges.length === 0) {
        return null;
    }

    const wrap = document.createElement('span');
    wrap.className = 'badges';

    for (const badge of message.badges) {
        if (!badge.url) {
            continue;
        }

        const img = document.createElement('img');
        img.className = 'badge';
        img.src = badge.url;
        img.alt = badge.name || '';
        img.loading = 'lazy';
        wrap.appendChild(img);
    }

    return wrap.childElementCount > 0 ? wrap : null;
}

function buildBody(message) {
    const frag = document.createDocumentFragment();

    if (Array.isArray(message.fragments) && message.fragments.length > 0) {
        for (const part of message.fragments) {
            if (part.type === 'emote' && part.url) {
                const img = document.createElement('img');
                img.className = 'emote';
                img.src = part.url;
                img.alt = part.text || '';
                img.loading = 'lazy';
                frag.appendChild(img);
                continue;
            }

            if (part.type === 'gif' && part.url) {
                if (state.twitch?.hide_gifs) {
                    continue;
                }

                const img = document.createElement('img');
                img.className = 'gif';
                img.src = part.url;
                img.alt = part.text || '';
                img.loading = 'lazy';
                frag.appendChild(img);
                continue;
            }

            frag.appendChild(document.createTextNode(part.text || ''));
        }

        return frag;
    }

    frag.appendChild(document.createTextNode(message.text || ''));

    return frag;
}

function scheduleFade(el) {
    if (!state.twitch?.fade) {
        return;
    }

    const seconds = state.twitch.fade_timeout > 0 ? state.twitch.fade_timeout : 30;

    setTimeout(() => {
        el.classList.add('out');
        setTimeout(() => el.remove(), 600);
    }, seconds * 1000);
}

function renderEvent(message) {
    const el = document.createElement('div');
    el.className = 'message event';
    el.textContent = message.systemMessage || message.text || '';
    scheduleFade(el);

    return el;
}

function renderMessage(message) {
    const el = document.createElement('div');
    el.className = 'message';

    if (message.isAction) {
        el.classList.add('action');
    }

    if (state.showTimestamps) {
        const time = document.createElement('span');
        time.className = 'timestamp';
        time.textContent = formatTime(message.timestamp);
        el.appendChild(time);
    }

    const badges = buildBadges(message);
    if (badges) {
        el.appendChild(badges);
    }

    const username = document.createElement('span');
    username.className = 'username';
    username.textContent = message.username || '';
    username.style.setProperty('--user-color', message.color || '#ffffff');
    el.appendChild(username);

    if (state.theme?.show_colon !== false) {
        const colon = document.createElement('span');
        colon.className = 'separator';
        colon.textContent = ':';
        el.appendChild(colon);
        el.appendChild(document.createTextNode(' '));
    } else {
        el.appendChild(document.createTextNode(' '));
    }

    el.appendChild(buildBody(message));
    scheduleFade(el);

    return el;
}

function append(message) {
    const isEvent = Boolean(message.systemMessage) || (message.eventType && message.eventType !== '');
    const el = isEvent ? renderEvent(message) : renderMessage(message);

    list.appendChild(el);

    while (list.childElementCount > MAX_MESSAGES) {
        list.removeChild(list.firstElementChild);
    }
}

function connect() {
    const source = new EventSource('/events');

    source.addEventListener('message', (event) => {
        try {
            append(JSON.parse(event.data));
        } catch (err) {
            console.error('bad payload', err);
        }
    });

    // EventSource reconnects on its own; this only surfaces the state in devtools.
    source.addEventListener('error', () => {
        console.warn('overlay: stream lost, reconnecting');
    });
}

async function boot() {
    try {
        const response = await fetch('/api/config', { cache: 'no-store' });
        const cfg = await response.json();

        state.theme = cfg.theme;
        state.twitch = cfg.twitch;
        state.showTimestamps = Boolean(cfg.showTimestamps);

        applyTheme(cfg.theme);
    } catch (err) {
        console.error('overlay: cannot load config', err);
    }

    connect();
}

void boot();
