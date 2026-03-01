import {HoistService, XH} from '@xh/hoist/core';
import {widgetRegistry} from '../dash/WidgetRegistry';
import {DashSpec} from '../dash/types';
import {CITIES} from '../widgets/CityChooserWidget';
import {ToolDefinition} from './LlmToolService';

/** A content block in an Anthropic API message. */
export interface ContentBlock {
    type: 'text' | 'tool_use' | 'tool_result';
    // text block
    text?: string;
    // tool_use block
    id?: string;
    name?: string;
    input?: Record<string, any>;
    // tool_result block
    tool_use_id?: string;
    content?: string;
    is_error?: boolean;
}

/**
 * A message in the conversation history.
 * User messages use a simple string content; assistant messages may contain
 * rich content blocks (text + tool_use) when tool calling is active.
 */
export interface ChatMessage {
    role: 'user' | 'assistant';
    content: string | ContentBlock[];
}

/**
 * Service for assembling LLM prompts, calling the server proxy,
 * and parsing spec responses.
 */
export class LlmChatService extends HoistService {
    static instance: LlmChatService;

    /** Build the system prompt including widget schemas, spec format, and rules. */
    buildSystemPrompt(currentSpec?: DashSpec): string {
        const widgetDocs = widgetRegistry.generateLLMPrompt();
        const cityList = CITIES.join(', ');
        const parts: string[] = [
            SYSTEM_INTRO,
            '## Widget Types\n\n' + widgetDocs,
            SPEC_FORMAT_DOCS,
            WIRING_RULES,
            LAYOUT_RULES,
            CITY_RULES.replace('{{CITIES}}', cityList)
        ];

        if (currentSpec) {
            parts.push(
                "## Current Dashboard Spec\n\nThe user's current dashboard is shown below. " +
                    'When modifying, preserve widgets not mentioned in the request.\n\n```json\n' +
                    JSON.stringify(currentSpec, null, 2) +
                    '\n```'
            );
        }

        parts.push(TOOL_USE_GUIDANCE);
        parts.push(OUTPUT_RULES);
        return parts.join('\n\n');
    }

    /**
     * Call the LLM proxy endpoint and return the full response.
     * Returns the raw content block array (which may contain text + tool_use blocks),
     * the stop reason, and the full API response.
     */
    async generateAsync(
        systemPrompt: string,
        messages: ChatMessage[],
        tools?: ToolDefinition[]
    ): Promise<{content: ContentBlock[]; stopReason: string; raw: any}> {
        const body: any = {systemPrompt, messages};
        if (tools?.length) body.tools = tools;

        const response = await XH.postJson({
            url: 'llm/generate',
            body,
            timeout: {interval: 120_000, message: 'LLM request timed out.'},
            track: {
                category: 'WeatherV2',
                message: 'LLM generate',
                severity: 'DEBUG',
                data: {messageCount: messages.length},
                logData: true
            }
        });

        const content: ContentBlock[] = response?.content ?? [];
        const stopReason: string = response?.stop_reason ?? 'end_turn';
        return {content, stopReason, raw: response};
    }

    /**
     * Extract a JSON dashboard spec from the LLM's text response.
     * Looks for the first ```json code block, or falls back to raw JSON.
     */
    parseSpecFromResponse(text: string): DashSpec | null {
        // Try to find a fenced JSON block
        const fenceMatch = text.match(/```(?:json)?\s*\n?([\s\S]*?)```/);
        if (fenceMatch) {
            try {
                return JSON.parse(fenceMatch[1].trim()) as DashSpec;
            } catch {
                // Fall through
            }
        }

        // Try to parse the entire response as JSON
        try {
            return JSON.parse(text.trim()) as DashSpec;
        } catch {
            // Fall through
        }

        // Try to find a JSON object in the response
        const braceMatch = text.match(/\{[\s\S]*\}/);
        if (braceMatch) {
            try {
                return JSON.parse(braceMatch[0]) as DashSpec;
            } catch {
                // Give up
            }
        }

        return null;
    }
}

//--------------------------------------------------
// System prompt sections
//--------------------------------------------------
const SYSTEM_INTRO = `You are a friendly dashboard assistant for Weather Dashboard V2. Your job is to build and modify weather dashboards based on what the user asks for.

Your audience is **business users, not software developers**. In your conversational responses:
- Use plain, approachable language. Talk about what the dashboard will *show* and *do*, not how it works internally.
- **Never mention** technical terms like "bindings", "wiring", "instance IDs", "specs", "JSON", "viewSpecId", "state arrays", or grid coordinates unless the user explicitly asks a technical or developer-oriented question.
- Instead of "I'll wire the forecast chart's city input to the city chooser via a binding", say something like "I'll connect the forecast chart to your city selector so it updates when you pick a different city."
- Keep responses concise and helpful — a sentence or two explaining what you're setting up is plenty.
- If the user asks a technical or developer question (e.g. about the JSON format, how bindings work, the spec structure), then and only then should you provide technical details.

The dashboard uses a 12-column grid layout with configurable widgets that can be connected together so they share data (e.g. a city selector driving all the charts).`;

const SPEC_FORMAT_DOCS = `## Dashboard Spec Format

The spec is a JSON object with this structure:
\`\`\`json
{
    "version": 1,
    "state": [
        {
            "viewSpecId": "widgetTypeId",
            "layout": {"x": 0, "y": 0, "w": 6, "h": 5},
            "state": {
                "bindings": {
                    "inputName": {"fromWidget": "sourceInstanceId", "output": "outputName"}
                },
                "configKey": "configValue"
            }
        }
    ]
}
\`\`\`

Each widget in the \`state\` array has:
- \`viewSpecId\` (required): Widget type from the catalog.
- \`layout\` (required): Grid position. \`x\` is column (0-11), \`y\` is row, \`w\` is width (1-12), \`h\` is height.
- \`state\` (optional): Widget config and input bindings.

**Widget Titles:** Display widgets (currentConditions, forecastChart, precipChart, windChart, summaryGrid) auto-generate their titles from their bound city (e.g. "Forecast — Tokyo"). Do NOT set a top-level \`title\` for these widgets — it will be overwritten. Input widgets (cityChooser, unitsToggle) also receive automatic static titles ("City", "Units") — do NOT set titles for these either. For the \`markdownContent\` widget, set the title via \`state.title\` (e.g. \`"state": {"title": "Dashboard Header", "content": "..."}\`). The dashInspector uses its default title.`;

const WIRING_RULES = `## Wiring Rules

Widgets communicate via bindings. An input widget publishes outputs; display widgets consume them via bindings.

**Instance ID assignment:** Widget instance IDs are assigned by order of appearance in the \`state\` array using 0-indexed suffixes: first instance of type X gets ID "X_0", second gets "X_1", third "X_2", etc. Use these IDs in binding references.

**Binding format:**
- Wire to another widget: \`{"fromWidget": "instanceId", "output": "outputName"}\`
- Constant value: \`{"const": "value"}\`

**IMPORTANT: Every display widget input MUST be set via a binding** — either a \`fromWidget\` binding or a \`const\` binding. Do NOT set input values as direct state keys. For example, to set a widget's city to "Tokyo", use \`"bindings": {"city": {"const": "Tokyo"}}\`, NOT \`"city": "Tokyo"\` at the state level.

**Common wiring patterns:**
- CityChooser publishes \`selectedCity\` → display widgets bind their \`city\` input to it, e.g. \`{"fromWidget": "cityChooser_0", "output": "selectedCity"}\`.
- UnitsToggle publishes \`units\` → display widgets bind their \`units\` input to it, e.g. \`{"fromWidget": "unitsToggle_0", "output": "units"}\`.
- Fixed city (no chooser widget): use a const binding, e.g. \`"bindings": {"city": {"const": "Tokyo"}}\`.
- Fixed units (no toggle widget): use a const binding, e.g. \`"bindings": {"units": {"const": "metric"}}\`.`;

const LAYOUT_RULES = `## Layout Rules

- The grid has **12 columns** and each row is **30px** tall. Widgets cannot extend past column 12 (x + w <= 12).
- Rows are unlimited — widgets can stack vertically.
- Minimum widget size varies by type (see widget docs).
- Widgets should not overlap. Place them so x ranges don't overlap within the same y range.

**Sizing guidelines (row height = 30px):**
- Input widgets (cityChooser, unitsToggle): h=3 (90px) — just enough for the frame + control. **Always use h=3 for these** unless the user specifically requests a larger size. Making them taller wastes vertical space. Check each widget's "Ideal size" annotation and prefer it.
- Display widgets (charts, grids, conditions): h=8 (240px) is a good default. Use h=6 for compact or h=10+ for emphasis.
- Markdown banners: h=3 to h=5 depending on content length.

**Layout best practices:**
- Strive for balanced, symmetrical arrangements. Avoid leaving large empty gaps between widgets.
- Align widgets on common row boundaries where possible for a clean grid appearance.
- Place input controls (city chooser, units toggle) near the top for easy access.
- When comparing multiple cities, arrange them in evenly-spaced columns (e.g. 3 cities at w=4 each, or 2 cities at w=6 each).`;

const CITY_RULES = `## Available Cities

The city chooser dropdown includes these curated cities: {{CITIES}}.

However, the weather API accepts **any valid city name worldwide** — the dropdown also allows users to type in custom cities. When the user asks about a city not in the list, you can use it directly in the \`selectedCity\` config. Use the standard English name for the city (e.g. "Munich" not "München", "Rome" not "Roma").

If a user asks "what cities are available", mention both the curated list and the ability to enter any city name. If asked for a city you're unsure about, use it anyway — the weather API will handle it.`;

const TOOL_USE_GUIDANCE = `## Tools

You have tools available for performing app operations. When the user asks for an action like saving a view, switching themes, or opening a panel, you MUST invoke the tool via the tool_use mechanism — do NOT describe, simulate, or role-play tool calls in your text. Only the tool_use API actually executes actions; writing tool calls in text does nothing.

**When to use tools vs. JSON specs:**
- Use **tools** for app operations (saving views, changing theme, opening panels). The tool definitions describe each one.
- Use **JSON specs** for building or modifying dashboard layouts (adding/removing/repositioning widgets).
- You can combine both in one turn — e.g. generate a dashboard spec AND call save_dashboard_as_view.

After a tool executes, briefly confirm the result in your text response.`;

const OUTPUT_RULES = `## Output Rules

IMPORTANT: Always output a complete, valid JSON spec wrapped in a \`\`\`json code fence. Include ALL widgets — both new ones and any existing ones the user didn't ask to change. Do not output partial specs or diffs.

If the user asks to modify the dashboard, start from the current spec and make targeted changes. Preserve widget IDs, bindings, and layouts for widgets the user didn't mention.

Before the JSON spec, include a brief, friendly explanation of what you're setting up or changing — written for a business audience, not a technical one. Focus on what the user will *see* in the dashboard, not how it's implemented.

If the user asks a general question, or something conversational that does not require a dashboard change, respond naturally without producing a JSON spec. Not every message needs a dashboard update.`;
