import { Crown, Gem, Gift, Megaphone, Star, Sword, Users } from 'lucide-react';
import { useEffect, useState } from 'react';
import { emoteUrl, normalizeChannel, useTwitchChat } from '../live/twitchChat';
import { messagePlate, nameColor, readable, rgba } from './plates';

// On-stream chat box fed by the anonymous Twitch chat connection. Messages
// borrow the theme's lower-third look (`variant`, usually the '@lt' token), so
// a Cyber HUD chat gets slanted plates and a Sketchbook chat gets taped paper.
// Newest message sits at the bottom; older ones scroll off the top.

const BOTS = new Set(['nightbot', 'streamelements', 'streamlabs', 'moobot', 'fossabot', 'wizebot', 'soundalerts', 'sery_bot', 'botrixoficial']);

const BADGES = {
    broadcaster: { Icon: Crown, color: '#ff4f4f', title: 'Broadcaster' },
    moderator:   { Icon: Sword, color: '#2fd36b', title: 'Moderator' },
    vip:         { Icon: Gem,   color: '#ff4fd8', title: 'VIP' },
    subscriber:  { Icon: Star,  color: null,      title: 'Subscriber' },   // theme accent
};

// Sample lines so the box isn't empty in the editor and gallery thumbnails.
const DEMO = [
    { kind: 'message', id: 'd1', login: 'pixelpanda', user: 'PixelPanda', color: '#ff7ab6', badges: ['subscriber'], emotes: [], text: 'yooo just got here 👋' },
    { kind: 'message', id: 'd2', login: 'modmaria', user: 'ModMaria', color: '#2fd36b', badges: ['moderator'], emotes: [], text: 'welcome in! drink some water 💧' },
    { kind: 'event', event: 'sub', id: 'd3', login: 'nightowl', user: 'NightOwl', system: 'NightOwl subscribed for 6 months!', text: '', badges: [] },
    { kind: 'message', id: 'd4', login: 'speedrun_sam', user: 'speedrun_sam', color: '#5aa9ff', badges: [], emotes: [], text: 'that last play was actually insane' },
    { kind: 'event', event: 'raid', id: 'd5', login: 'cozycastle', user: 'CozyCastle', system: '42 raiders from CozyCastle have joined!', text: '', badges: [] },
    { kind: 'message', id: 'd6', login: 'lunatic', user: 'Lunatic', color: '#ffd23f', badges: ['vip'], emotes: [], text: 'GG chat, clip that' },
];

// ── Message body: text with Twitch emotes inlined ──────────────────────────

export const Body = ({ text, emotes, size }) => {
    if (!emotes?.length) return <>{text}</>;
    const chars = Array.from(text);   // emote offsets are code points
    const out = [];
    let pos = 0;
    emotes.forEach((e, i) => {
        if (e.start > pos) out.push(chars.slice(pos, e.start).join(''));
        out.push(
            <img key={i} src={emoteUrl(e.id)} alt={chars.slice(e.start, e.end + 1).join('')}
                style={{ height: size * 1.6, verticalAlign: 'middle', margin: '-4px 1px' }} />
        );
        pos = e.end + 1;
    });
    if (pos < chars.length) out.push(chars.slice(pos).join(''));
    return <>{out}</>;
};

const EVENT_ICONS = { raid: Users, subgift: Gift, submysterygift: Gift, announcement: Megaphone };

const Message = ({ m, i, variant, T, radius, fontSize, fontColor, showBadges }) => {
    const p = messagePlate(variant, T, radius, i);
    const isEvent = m.kind === 'event';
    const nameCol = p.ink ? '#2a2620' : readable(m.color, nameColor(m.login));
    const textCol = p.text?.color ?? fontColor;
    const badges = showBadges ? (m.badges ?? []).filter(id => BADGES[id]) : [];

    const name = (
        <span style={{ fontWeight: 700, color: nameCol, ...p.name, display: 'inline-flex', alignItems: 'center', gap: 4 }}>
            {badges.map(id => {
                const { Icon, color, title } = BADGES[id];
                return <Icon key={id} size={fontSize * 0.95} color={p.ink ? '#2a2620' : (color ?? T.accent)} strokeWidth={2.4} aria-label={title} />;
            })}
            {m.user}
        </span>
    );

    if (isEvent) {
        const Icon = EVENT_ICONS[m.event] ?? Star;
        const eventBox = p.ink ? p.box : { ...p.box, background: `linear-gradient(90deg, ${rgba(T.accent, 0.38)}, ${rgba(T.panelColor, 0.85)})`, border: `1px solid ${rgba(T.accent, 0.7)}` };
        return (
            <div style={{ ...eventBox, animation: 'chatIn 0.35s ease-out', fontSize, color: textCol, lineHeight: 1.35 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontWeight: 700 }}>
                    <Icon size={fontSize * 1.1} color={p.ink ? '#2a2620' : T.accent} strokeWidth={2.4} style={{ flexShrink: 0 }} />
                    <span>{m.system || `${m.user} ${m.event}`}</span>
                </div>
                {m.text && <div style={{ opacity: 0.85, marginTop: 2 }}><Body text={m.text} emotes={m.emotes} size={fontSize} /></div>}
            </div>
        );
    }

    if (p.window) {
        return (
            <div style={{ ...p.box, animation: 'chatIn 0.35s ease-out', fontSize, lineHeight: 1.35 }}>
                <div style={{ padding: '2px 10px', marginBottom: 4, background: `linear-gradient(90deg, ${T.accent}, ${T.accent2 ?? T.accent})`, fontSize: fontSize * 0.75, fontFamily: 'ui-monospace, monospace', fontWeight: 700, color: '#0b0b1a' }}>
                    {m.user}.txt
                </div>
                <div style={{ padding: '0 10px', color: textCol, wordBreak: 'break-word' }}><Body text={m.text} emotes={m.emotes} size={fontSize} /></div>
            </div>
        );
    }

    return (
        <div style={{ ...p.box, animation: 'chatIn 0.35s ease-out', fontSize, lineHeight: 1.35, color: textCol, wordBreak: 'break-word', ...p.text }}>
            {name}
            <span style={{ opacity: 0.55, margin: '0 6px 0 2px' }}>{m.action ? '' : ':'}</span>
            <span style={m.action ? { fontStyle: 'italic', color: nameCol } : undefined}>
                <Body text={m.text} emotes={m.emotes} size={fontSize} />
            </span>
        </div>
    );
};

const ChatBox = ({ element, T, channel: layoutChannel, editMode, preview }) => {
    const channel = normalizeChannel(element.channel || layoutChannel);
    const { items, status } = useTwitchChat(channel);

    // Fade-out needs a clock; only tick when fading is on.
    const fadeSec = Math.max(0, element.fadeSec ?? 0);
    const [now, setNow] = useState(() => Date.now());
    useEffect(() => {
        if (!fadeSec) return undefined;
        const t = setInterval(() => setNow(Date.now()), 1000);
        return () => clearInterval(t);
    }, [fadeSec]);

    const showSample = !channel || (editMode && items.length === 0);
    if (showSample && !editMode && !preview) return null;   // on stream with no channel: draw nothing

    const max = Math.max(1, element.maxMessages ?? 10);
    const visible = (showSample ? DEMO : items)
        .filter(m => element.showEvents !== false || m.kind !== 'event')
        .filter(m => !(element.hideCommands !== false && m.kind === 'message' && m.text.startsWith('!')))
        .filter(m => !(element.hideBots !== false && BOTS.has(m.login)))
        .filter(m => showSample || !fadeSec || now - m.ts < fadeSec * 1000)
        .slice(-max);

    const fontSize = element.fontSize ?? 18;
    const statusLabel = !channel ? 'Sample chat — set your Twitch channel'
        : status === 'connected' ? `#${channel} · waiting for messages`
        : status === 'error' ? `#${channel} · channel not found`
        : `Connecting to #${channel}…`;

    return (
        <div style={{ position: 'relative', width: '100%', height: '100%', opacity: element.opacity ?? 1 }}>
            <div style={{
                width: '100%', height: '100%', overflow: 'hidden',
                display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', gap: Math.round(fontSize * 0.4),
                fontFamily: T.fontFamily,
                // Soft top fade so old messages dissolve instead of being cut off.
                WebkitMaskImage: 'linear-gradient(180deg, transparent 0, #000 12%)', maskImage: 'linear-gradient(180deg, transparent 0, #000 12%)',
            }}>
                {visible.map((m, i) => (
                    <div key={m.id} style={{ opacity: showSample ? 0.75 : 1, flexShrink: 0 }}>
                        <Message
                            m={m} i={i} variant={element.variant} T={T} radius={T.cornerRadius ?? 8}
                            fontSize={fontSize} fontColor={element.fontColor || T.textColor} showBadges={element.showBadges !== false}
                        />
                    </div>
                ))}
            </div>
            {editMode && showSample && (
                <div style={{ position: 'absolute', top: 6, left: 6, right: 6, display: 'flex', justifyContent: 'center', pointerEvents: 'none' }}>
                    <span style={{ padding: '3px 10px', borderRadius: 99, background: 'rgba(0,0,0,0.75)', border: '1px solid rgba(255,255,255,0.15)', color: status === 'error' ? '#fca5a5' : 'rgba(255,255,255,0.8)', fontSize: 11, fontFamily: 'ui-monospace, monospace' }}>
                        {statusLabel}
                    </span>
                </div>
            )}
        </div>
    );
};

export default ChatBox;
