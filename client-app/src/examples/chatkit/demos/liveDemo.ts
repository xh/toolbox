import {AnthropicCodec, HoistChatTransport} from '@xh/hoist-chat-kit/transport';
import {Icon} from '@xh/hoist/icon';
import {createCatalog} from './catalog';
import type {ChatKitDemo} from './Types';

/**
 * A live conversation with Claude, through the Toolbox server's `llm/stream` relay, with the
 * generative UI catalog - so that a real model can answer with grids, charts, metrics and cards.
 */
export const liveDemo: ChatKitDemo = {
    id: 'live',
    title: 'Live model',
    description: 'Claude, with the generative UI catalog',
    icon: Icon.bolt(),
    heading: 'Ask Claude anything',
    intro:
        'A real conversation with Claude, relayed by the Toolbox server. The model has the ' +
        'same four components as the Generative UI demo, and picks when to use them. It has no ' +
        'live data, so it answers with realistic sample figures.',
    suggestions: [
        {text: 'Show a sample equity portfolio as a grid'},
        {text: 'Chart 12 months of revenue for a SaaS company'},
        {text: 'Give me KPIs for a regional bank, then a card for its CEO'}
    ],
    createChatConfig: () => {
        const catalog = createCatalog();
        return {
            transport: new HoistChatTransport({
                url: 'llm/stream',
                codec: new AnthropicCodec({
                    system: `${SYSTEM_PROMPT}\n\n${catalog.instructions}`,
                    cacheControl: true
                }),
                track: {category: 'ChatKit', message: 'Live demo call', severity: 'DEBUG'}
            }),
            tools: catalog.tools,
            // Each component the model shows ends a step, and each step is a model call that
            // counts toward the server's per-user `llmRateLimit`. Four allows three components.
            maxSteps: 4
        };
    }
};

//------------------
// Implementation
//------------------
const SYSTEM_PROMPT = [
    'You are the assistant in the Chat Kit demo of Toolbox, the demo app for the Hoist ' +
        'framework by Extremely Heavy Industries (XH).',
    'You have no access to live or private data. When asked about portfolios, companies or ' +
        'markets, answer with realistic sample figures, and say once, briefly, that they are ' +
        'sample data.',
    'Keep replies short. Show data with the UI components below rather than long tables in text.'
].join(' ');
