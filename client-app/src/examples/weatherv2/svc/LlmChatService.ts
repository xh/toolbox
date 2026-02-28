import {HoistService, XH} from '@xh/hoist/core';
import {widgetRegistry} from '../dash/WidgetRegistry';
import {DashSpec} from '../dash/types';

export interface ChatMessage {
    role: 'user' | 'assistant';
    content: string;
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
        const parts: string[] = [
            SYSTEM_INTRO,
            '## Widget Types\n\n' + widgetDocs,
            SPEC_FORMAT_DOCS,
            WIRING_RULES,
            LAYOUT_RULES
        ];

        if (currentSpec) {
            parts.push(
                "## Current Dashboard Spec\n\nThe user's current dashboard is shown below. " +
                    'When modifying, preserve widgets not mentioned in the request.\n\n```json\n' +
                    JSON.stringify(currentSpec, null, 2) +
                    '\n```'
            );
        }

        parts.push(OUTPUT_RULES);
        return parts.join('\n\n');
    }

    /** Call the LLM proxy endpoint and return the raw response. */
    async generateAsync(
        systemPrompt: string,
        messages: ChatMessage[]
    ): Promise<{content: string; raw: any}> {
        const response = await XH.postJson({
            url: 'llm/generate',
            body: {systemPrompt, messages},
            track: {
                category: 'WeatherV2',
                message: 'LLM generate',
                severity: 'DEBUG',
                data: {messageCount: messages.length},
                logData: true
            }
        });

        // Anthropic API returns {content: [{type: 'text', text: '...'}], ...}
        const textBlock = response?.content?.find((c: any) => c.type === 'text');
        const content = textBlock?.text ?? '';
        return {content, raw: response};
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
const SYSTEM_INTRO = `You are a dashboard configuration assistant for Weather Dashboard V2. Your job is to generate and modify dashboard specifications (JSON) based on user requests.

The dashboard uses a 12-column grid layout with configurable widgets that can be wired together through input/output bindings.`;

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

**Widget Titles:** Display widgets (currentConditions, forecastChart, precipChart, windChart, summaryGrid) auto-generate their titles from their bound city (e.g. "Forecast — Tokyo"). Do NOT set a top-level \`title\` for these widgets — it will be overwritten. For the \`markdownContent\` widget, set the title via \`state.title\` (e.g. \`"state": {"title": "Dashboard Header", "content": "..."}\`). Input widgets (cityChooser, unitsToggle) and dashInspector use their default titles.`;

const WIRING_RULES = `## Wiring Rules

Widgets communicate via bindings. An input widget publishes outputs; display widgets consume them via bindings.

**Instance ID assignment:** Widget instance IDs are assigned by order of appearance in the \`state\` array using 0-indexed suffixes: first instance of type X gets ID "X_0", second gets "X_1", third "X_2", etc. Use these IDs in binding references.

**Binding format:**
- Wire to another widget: \`{"fromWidget": "instanceId", "output": "outputName"}\`
- Constant value: \`{"const": "value"}\`

**Common wiring patterns:**
- CityChooser publishes \`selectedCity\` → display widgets bind their \`city\` input to it, e.g. \`{"fromWidget": "cityChooser_0", "output": "selectedCity"}\`.
- UnitsToggle publishes \`units\` → display widgets bind their \`units\` input to it, e.g. \`{"fromWidget": "unitsToggle_0", "output": "units"}\`.`;

const LAYOUT_RULES = `## Layout Rules

- The grid has **12 columns**. Widgets cannot extend past column 12 (x + w <= 12).
- Rows are unlimited — widgets can stack vertically.
- Minimum widget size varies by type (see widget docs).
- Widgets should not overlap. Place them so x ranges don't overlap within the same y range.`;

const OUTPUT_RULES = `## Output Rules

IMPORTANT: Always output a complete, valid JSON spec wrapped in a \`\`\`json code fence. Include ALL widgets — both new ones and any existing ones the user didn't ask to change. Do not output partial specs or diffs.

If the user asks to modify the dashboard, start from the current spec and make targeted changes. Preserve widget IDs, bindings, and layouts for widgets the user didn't mention.

Respond conversationally before the JSON spec — briefly explain what you're doing.`;
