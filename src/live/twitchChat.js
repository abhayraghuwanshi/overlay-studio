// Read-only Twitch chat over Twitch's IRC WebSocket, joined anonymously
// (a "justinfan" login): no OAuth, no API key, no backend. The streamer only
// types their channel name. Besides chat lines, the same feed carries subs,
// re-subs, gift subs, raids and announcements (USERNOTICE) plus moderation
// (CLEARCHAT / CLEARMSG), so deleted messages and timed-out users vanish from
// the overlay too.
//
// One connection per channel is shared by every subscriber (several chat
// boxes, or the same box remounting on a scene switch), and it keeps a short
// rolling buffer so a newly mounted box starts with recent history.

import { useEffect, useRef, useState } from 'react';

const IRC_URL = 'wss://irc-ws.chat.twitch.tv:443';
const BUFFER = 60;            // messages kept per channel
const IDLE_CLOSE_MS = 4000;   // grace period before closing an unused socket

// Accepts "name", "@name", "#name" or a twitch.tv URL; returns "" if invalid.
export const normalizeChannel = (raw) => {
    const s = String(raw || '').trim().toLowerCase()
        .replace(/^(https?:\/\/)?(www\.|m\.)?twitch\.tv\//, '')
        .replace(/^[@#]/, '')
        .split(/[/?#]/)[0];
    return /^[a-z0-9_]{3,25}$/.test(s) ? s : '';
};

// ── IRC parsing ────────────────────────────────────────────────────────────

const unescapeTag = (v = '') =>
    v.replace(/\\(.)/g, (_, c) => ({ s: ' ', ':': ';', '\\': '\\', r: '\r', n: '\n' }[c] ?? c));

const parseLine = (line) => {
    let rest = line;
    const tags = {};
    let prefix = null;
    if (rest.startsWith('@')) {
        const i = rest.indexOf(' ');
        for (const kv of rest.slice(1, i).split(';')) {
            const j = kv.indexOf('=');
            tags[j === -1 ? kv : kv.slice(0, j)] = j === -1 ? '' : unescapeTag(kv.slice(j + 1));
        }
        rest = rest.slice(i + 1);
    }
    if (rest.startsWith(':')) {
        const i = rest.indexOf(' ');
        prefix = rest.slice(1, i);
        rest = rest.slice(i + 1);
    }
    let trailing = null;
    const t = rest.indexOf(' :');
    if (t !== -1) {
        trailing = rest.slice(t + 2);
        rest = rest.slice(0, t);
    }
    const [command, ...params] = rest.split(' ');
    return { tags, prefix, command, params, trailing };
};

// "25:0-4,12-16/1902:6-10" → [{ id, start, end }] sorted by position.
// Offsets are Unicode code points, not UTF-16 units.
const parseEmotes = (raw) => {
    if (!raw) return [];
    const out = [];
    for (const group of raw.split('/')) {
        const [id, ranges] = group.split(':');
        if (!ranges) continue;
        for (const r of ranges.split(',')) {
            const [start, end] = r.split('-').map(Number);
            if (Number.isFinite(start) && Number.isFinite(end)) out.push({ id, start, end });
        }
    }
    return out.sort((a, b) => a.start - b.start);
};

// "broadcaster/1,subscriber/12" → ['broadcaster', 'subscriber']
const parseBadges = (raw) => (raw ? raw.split(',').map(b => b.split('/')[0]).filter(Boolean) : []);

const loginOf = (prefix) => (prefix ? prefix.split('!')[0] : '');

// USERNOTICE msg-ids shown as highlighted events in the chat box.
const EVENT_IDS = new Set(['sub', 'resub', 'subgift', 'submysterygift', 'giftpaidupgrade', 'raid', 'announcement', 'bitsbadgetier']);

const toEvent = ({ tags, prefix, command, trailing }) => {
    if (command === 'PRIVMSG') {
        let text = trailing ?? '';
        let action = false;
        // "/me" lines arrive wrapped as \x01ACTION …\x01 (a CTCP action).
        const CTCP = String.fromCharCode(1);
        if (text.startsWith(`${CTCP}ACTION `) && text.endsWith(CTCP)) { text = text.slice(8, -1); action = true; }
        return {
            kind: 'message',
            id: tags.id || `${Date.now()}-${Math.random()}`,
            login: tags.login || loginOf(prefix),
            user: tags['display-name'] || loginOf(prefix),
            color: tags.color || '',
            badges: parseBadges(tags.badges),
            emotes: parseEmotes(tags.emotes),
            bits: Number(tags.bits) || 0,
            text, action,
            ts: Number(tags['tmi-sent-ts']) || Date.now(),
        };
    }
    if (command === 'USERNOTICE' && EVENT_IDS.has(tags['msg-id'])) {
        return {
            kind: 'event',
            event: tags['msg-id'],
            id: tags.id || `${Date.now()}-${Math.random()}`,
            login: tags.login || '',
            user: tags['display-name'] || tags.login || '',
            color: tags.color || '',
            badges: parseBadges(tags.badges),
            emotes: parseEmotes(tags.emotes),
            system: tags['system-msg'] || '',
            text: trailing ?? '',
            months: Number(tags['msg-param-cumulative-months']) || 0,
            viewers: Number(tags['msg-param-viewerCount']) || 0,
            plan: tags['msg-param-sub-plan'] || '',
            recipient: tags['msg-param-recipient-display-name'] || '',
            giftCount: Number(tags['msg-param-mass-gift-count']) || 0,
            ts: Number(tags['tmi-sent-ts']) || Date.now(),
        };
    }
    if (command === 'CLEARMSG') return { kind: 'delete', id: tags['target-msg-id'] };
    if (command === 'CLEARCHAT') return { kind: 'clear', login: trailing || null };
    return null;
};

// One raw IRC line → chat item / moderation event (or null).
export const parseIrcLine = (line) => toEvent(parseLine(line));

// ── Alerts ─────────────────────────────────────────────────────────────────
// The alert box and event list share one normalised shape:
//   { id, type, user, amount, detail, message, emotes, ts }
// type: sub | resub | gift | giftbomb | raid | cheer

const TIER = { Prime: 'Prime', 1000: 'Tier 1', 2000: 'Tier 2', 3000: 'Tier 3' };

export const toAlert = (ev) => {
    if (!ev) return null;
    const base = { id: ev.id, user: ev.user, message: ev.text || '', emotes: ev.emotes ?? [], ts: ev.ts ?? Date.now() };
    if (ev.kind === 'message') {
        if (!ev.bits) return null;
        // Strip the "Cheer100" tokens so the alert shows the human message.
        const message = ev.text.replace(/\b[a-z]+\d+\b/gi, '').replace(/\s+/g, ' ').trim();
        return { ...base, type: 'cheer', amount: ev.bits, detail: `${ev.bits} bits`, message, emotes: [] };
    }
    if (ev.kind !== 'event') return null;
    const tier = TIER[ev.plan] ?? '';
    switch (ev.event) {
        case 'sub':            return { ...base, type: 'sub', amount: 1, detail: tier === 'Prime' ? 'Prime sub' : `${tier || 'New'} sub` };
        case 'resub':          return { ...base, type: 'resub', amount: ev.months, detail: `${ev.months} months${tier === 'Prime' ? ' · Prime' : ''}` };
        case 'subgift':        return { ...base, type: 'gift', amount: 1, detail: `gifted ${ev.recipient || 'a sub'}`, message: '' };
        case 'submysterygift': return { ...base, type: 'giftbomb', amount: ev.giftCount, detail: `gifted ${ev.giftCount} subs`, message: '' };
        case 'raid':           return { ...base, type: 'raid', amount: ev.viewers, detail: `${ev.viewers} raiders`, message: '' };
        default:               return null;
    }
};

// ── Shared per-channel connection ──────────────────────────────────────────

export class ChannelFeed {
    constructor(channel) {
        this.channel = channel;
        this.items = [];
        this.alerts = [];             // recent alert-worthy events, newest last
        this.giftBombs = new Map();   // gifter login → individual gift notices left to fold
        this.status = 'connecting';
        this.listeners = new Set();
        this.ws = null;
        this.retry = 0;
        this.retryTimer = null;
        this.idleTimer = null;
        this.closed = false;
    }

    emit() {
        for (const l of this.listeners) l.onChange?.(this.items, this.status, this.alerts);
    }

    // A gift bomb arrives as one submysterygift followed by one subgift per
    // recipient; fold those into the single bomb alert.
    foldGift(ev) {
        if (ev.kind !== 'event') return false;
        if (ev.event === 'submysterygift' && ev.giftCount > 0) {
            this.giftBombs.set(ev.login, { left: ev.giftCount, until: Date.now() + 60000 });
            return false;
        }
        if (ev.event === 'subgift') {
            const bomb = this.giftBombs.get(ev.login);
            if (bomb && bomb.left > 0 && Date.now() < bomb.until) {
                bomb.left -= 1;
                if (bomb.left === 0) this.giftBombs.delete(ev.login);
                return true;
            }
        }
        return false;
    }

    setStatus(s) {
        if (this.status !== s) { this.status = s; this.emit(); }
    }

    connect() {
        this.closed = false;
        this.setStatus('connecting');
        let ws;
        try { ws = new WebSocket(IRC_URL); } catch { this.scheduleRetry(); return; }
        this.ws = ws;
        ws.onopen = () => {
            ws.send('CAP REQ :twitch.tv/tags twitch.tv/commands');
            ws.send('PASS SCHMOOPIIE');
            ws.send(`NICK justinfan${Math.floor(10000 + Math.random() * 80000)}`);
            ws.send(`JOIN #${this.channel}`);
        };
        ws.onmessage = (e) => this.ingest(e.data);
        ws.onclose = () => {
            if (this.ws === ws) this.ws = null;
            if (!this.closed) this.scheduleRetry();
        };
        ws.onerror = () => { /* onclose follows and schedules the retry */ };
    }

    // Raw socket payload → handled lines (one frame can carry several).
    ingest(raw) {
        for (const line of String(raw).split('\r\n')) {
            if (line) this.handle(parseLine(line));
        }
    }

    scheduleRetry() {
        this.setStatus('reconnecting');
        clearTimeout(this.retryTimer);
        const delay = Math.min(30000, 1000 * 2 ** this.retry++);
        this.retryTimer = setTimeout(() => { if (!this.closed) this.connect(); }, delay);
    }

    handle(msg) {
        if (msg.command === 'PING') { this.ws?.send(`PONG :${msg.trailing ?? 'tmi.twitch.tv'}`); return; }
        if (msg.command === 'RECONNECT') { this.ws?.close(); return; }
        if (msg.command === 'ROOMSTATE' || msg.command === 'JOIN') { this.retry = 0; this.setStatus('connected'); return; }
        // Joining a channel that doesn't exist is silently ignored by Twitch;
        // a NOTICE here usually means the channel is suspended or the name is bad.
        if (msg.command === 'NOTICE' && msg.params[0] === `#${this.channel}`) { this.setStatus('error'); return; }

        const ev = toEvent(msg);
        if (!ev) return;
        if (ev.kind === 'delete') {
            this.items = this.items.filter(m => m.id !== ev.id);
        } else if (ev.kind === 'clear') {
            this.items = ev.login ? this.items.filter(m => m.login !== ev.login) : [];
        } else {
            this.items = [...this.items, ev].slice(-BUFFER);
            const alert = this.foldGift(ev) ? null : toAlert(ev);
            if (alert) {
                this.alerts = [...this.alerts, alert].slice(-BUFFER);
                for (const l of this.listeners) l.onAlert?.(alert);
            }
        }
        this.emit();
    }

    // listener: { onChange(items, status, alerts), onAlert(alert) } — onAlert
    // only fires for events that arrive after subscribing (no replays).
    subscribe(listener) {
        clearTimeout(this.idleTimer);
        this.listeners.add(listener);
        if (!this.ws && !this.retryTimer) this.connect();
        listener.onChange?.(this.items, this.status, this.alerts);
        return () => {
            this.listeners.delete(listener);
            if (this.listeners.size === 0) {
                this.idleTimer = setTimeout(() => this.close(), IDLE_CLOSE_MS);
            }
        };
    }

    close() {
        this.closed = true;
        clearTimeout(this.retryTimer);
        this.retryTimer = null;
        this.ws?.close();
        this.ws = null;
        feeds.delete(this.channel);
    }
}

const feeds = new Map();

const feedFor = (channel) => {
    let f = feeds.get(channel);
    if (!f) { f = new ChannelFeed(channel); feeds.set(channel, f); }
    return f;
};

// Live chat items (messages + events) and connection status for a channel.
// status: 'idle' (no channel) | 'connecting' | 'connected' | 'reconnecting' | 'error'
export const useTwitchChat = (rawChannel) => {
    const channel = normalizeChannel(rawChannel);
    const [state, setState] = useState({ channel: '', items: [], status: 'idle' });
    useEffect(() => {
        if (!channel) return undefined;
        return feedFor(channel).subscribe({ onChange: (items, status) => setState({ channel, items, status }) });
    }, [channel]);
    // Ignore state left over from a previous channel until the new feed reports.
    return state.channel === channel && channel ? state : { channel, items: [], status: channel ? 'connecting' : 'idle' };
};

export const emoteUrl = (id) => `https://static-cdn.jtvnw.net/emoticons/v2/${id}/default/dark/2.0`;

// Recent alert-worthy events (subs, gifts, raids, cheers) for the event list.
export const useTwitchEvents = (rawChannel) => {
    const channel = normalizeChannel(rawChannel);
    const [state, setState] = useState({ channel: '', alerts: [], status: 'idle' });
    useEffect(() => {
        if (!channel) return undefined;
        return feedFor(channel).subscribe({ onChange: (_items, status, alerts) => setState({ channel, alerts, status }) });
    }, [channel]);
    return state.channel === channel && channel ? state : { channel, alerts: [], status: channel ? 'connecting' : 'idle' };
};

// Calls `onAlert(alert)` for each new alert on the channel. The callback is
// read through a ref so callers needn't memoise it.
export const useTwitchAlerts = (rawChannel, onAlert) => {
    const channel = normalizeChannel(rawChannel);
    const cb = useRef(onAlert);
    useEffect(() => { cb.current = onAlert; });
    useEffect(() => {
        if (!channel) return undefined;
        return feedFor(channel).subscribe({ onAlert: (a) => cb.current?.(a) });
    }, [channel]);
};
