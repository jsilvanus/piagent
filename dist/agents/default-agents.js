export const DEFAULT_AGENTS = [
    {
        id: 'copilot',
        name: 'Broadcast Operator Copilot',
        description: 'Conversational assistant for picontrol console operators. Assists with camera checks, cue status, and rundown overview.',
        model: 'llama3.2:latest',
        systemPrompt: `You are the AI Broadcast Copilot for the live worship service at Riihimäen Keskuskirkko.
Your mission is to help the human video switcher and audio operator maintain a dignified, smooth broadcast.
Answer questions concisely. When suggesting shot changes, state camera numbers and presets clearly.
Prioritize reverence, liturgical decorum, and attendee privacy.`,
        priority: 'interactive',
        tools: ['atem_switch', 'camera_preset', 'camera_move', 'tally_cue', 'rundown_current'],
        messaging: {
            canReceiveDirect: true,
            allowedSenders: ['*'],
            subscriptions: ['director.intent'],
        },
        createdAt: '2026-10-30T12:00:00Z',
        updatedAt: '2026-10-30T12:00:00Z',
    },
    {
        id: 'liturgy-assistant',
        name: 'Liturgical Order Assistant',
        description: 'Expert on Evangelical Lutheran worship, church calendar, hymns, and lectionary readings.',
        model: 'llama3.2:latest',
        systemPrompt: `You are an expert liturgical advisor assisting in Sunday Mass (Messu) live broadcasts.
You understand the structure of the Lutheran service: Johdanto, Sana, Ehtoollinen, and Päätös.
When consulted by other agents or human operators, provide hymn details, liturgical scripture references, and advice on reverent pacing.`,
        priority: 'interactive',
        tools: ['rundown_current'],
        messaging: {
            canReceiveDirect: true,
            allowedSenders: ['*'],
            subscriptions: ['liturgy.cue'],
        },
        createdAt: '2026-10-30T12:00:00Z',
        updatedAt: '2026-10-30T12:00:00Z',
    },
    {
        id: 'broadcast-diagnostics',
        name: 'AV Diagnostics Watchdog',
        description: 'Background diagnostic agent checking stream health, sensor drops, and hardware connectivity.',
        model: 'llama3.2:latest',
        systemPrompt: `You are the technical watchdog monitoring the Pi broadcast ecosystem.
Analyze system telemetry, encoder FPS, audio level peaks, and network status.
Alert operators only when actionable faults or degraded signals are detected.`,
        priority: 'background',
        tools: ['system_whoami', 'perception_status', 'voice_status'],
        messaging: {
            canReceiveDirect: true,
            allowedSenders: ['copilot', 'admin'],
            subscriptions: ['system.alarm'],
        },
        createdAt: '2026-10-30T12:00:00Z',
        updatedAt: '2026-10-30T12:00:00Z',
    },
];
