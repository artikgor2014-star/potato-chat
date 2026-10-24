// Follower overlay: shows one card per new follower, then clears itself.
// Reads the same SSE stream as the chat overlay and ignores everything except
// `follow` events, so one server can drive both scenes.

const stage = document.getElementById('stage');

const state = {
    duration: 8,
    queue: [],
    showing: false,
    timer: null,
};

function hueOf(name) {
    let hash = 0;

    for (let i = 0; i < name.length; i += 1) {
        hash = (hash * 31 + name.charCodeAt(i)) % 360;
    }

    return hash;
}

function initials(name) {
    const trimmed = (name || '').trim();

    return trimmed.length === 0 ? '?' : trimmed.slice(0, 2).toUpperCase();
}

function buildCard(name) {
    const card = document.createElement('div');
    card.className = 'card';
    card.style.setProperty('--hue', String(hueOf(name)));

    const avatar = document.createElement('span');
    avatar.className = 'avatar';
    avatar.textContent = initials(name);

    const text = document.createElement('span');
    text.className = 'text';

    const label = document.createElement('span');
    label.className = 'label';
    label.textContent = state.label || 'new follower';

    const title = document.createElement('span');
    title.className = 'name';
    title.textContent = name;

    text.append(label, title);
    card.append(avatar, text);

    return card;
}

function showNext() {
    const name = state.queue.shift();

    if (!name) {
        state.showing = false;
        return;
    }

    state.showing = true;

    const card = buildCard(name);
    stage.replaceChildren(card);

    state.timer = window.setTimeout(() => {
        card.classList.add('out');
        window.setTimeout(showNext, 440);
    }, state.duration * 1000);
}

function enqueue(name) {
    if (!name) {
        return;
    }

    // A burst of follows plays one after another instead of overwriting.
    state.queue.push(name);

    if (!state.showing) {
        showNext();
    }
}

function connect() {
    const source = new EventSource('/events');

    source.addEventListener('message', (event) => {
        try {
            const message = JSON.parse(event.data);

            if (message.eventType !== 'follow') {
                return;
            }

            enqueue(message.username);
        } catch (err) {
            console.error('followers: bad payload', err);
        }
    });

    source.addEventListener('error', () => {
        console.warn('followers: stream lost, reconnecting');
    });
}

async function boot() {
    try {
        const response = await fetch('/api/config', { cache: 'no-store' });
        const cfg = await response.json();

        if (cfg.followers?.duration > 0) {
            state.duration = cfg.followers.duration;
        }

        state.label = cfg.followers?.label || 'new follower';
    } catch (err) {
        console.error('followers: cannot load config', err);
    }

    connect();
}

void boot();
