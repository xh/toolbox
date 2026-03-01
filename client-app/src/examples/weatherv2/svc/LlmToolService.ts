import {HoistService, XH} from '@xh/hoist/core';
import {AppModel} from '../AppModel';

export interface ToolDefinition {
    name: string;
    description: string;
    input_schema: {
        type: 'object';
        properties: Record<string, any>;
        required?: string[];
    };
}

/**
 * Service that defines and executes LLM tools (function calling).
 *
 * Tools are client-side operations that manipulate UI state — saving/loading views,
 * toggling theme, opening panels. The LLM chooses when to call them based on the
 * user's natural language requests.
 */
export class LlmToolService extends HoistService {
    static instance: LlmToolService;

    /** Return Anthropic-format tool definitions for the API request. */
    getToolDefinitions(): ToolDefinition[] {
        return TOOL_DEFINITIONS;
    }

    /** Execute a tool call and return a result string. */
    async executeToolAsync(
        name: string,
        input: Record<string, any>
    ): Promise<{content: string; isError: boolean}> {
        try {
            const result = await this.doExecuteAsync(name, input);
            return {content: result, isError: false};
        } catch (e) {
            return {content: e.message || `Tool "${name}" failed.`, isError: true};
        }
    }

    //------------------
    // Implementation
    //------------------
    private async doExecuteAsync(name: string, input: Record<string, any>): Promise<string> {
        const appModel = AppModel.instance,
            viewManager = appModel.weatherViewManager;

        switch (name) {
            case 'save_dashboard_as_view': {
                const viewName = input.name as string;
                if (!viewName?.trim()) throw new Error('View name is required.');
                await viewManager.saveAsAsync({
                    name: viewName.trim(),
                    group: null,
                    description: '',
                    isShared: false,
                    isGlobal: false,
                    value: viewManager.getValue()
                });
                return `View "${viewName.trim()}" saved successfully.`;
            }

            case 'switch_to_view': {
                const viewName = input.name as string;
                if (!viewName?.trim()) throw new Error('View name is required.');
                const target = viewManager.views.find(
                    v => v.name.toLowerCase() === viewName.trim().toLowerCase()
                );
                if (!target) {
                    const available = viewManager.views.map(v => v.name).join(', ');
                    throw new Error(
                        `No view found matching "${viewName}". Available views: ${available || 'none'}`
                    );
                }
                await viewManager.selectViewAsync(target, {alertUnsavedChanges: false});
                return `Switched to view "${target.name}".`;
            }

            case 'reset_dashboard': {
                await viewManager.resetAsync();
                return "Dashboard reset to the current view's saved state.";
            }

            case 'toggle_theme': {
                XH.toggleTheme();
                const newTheme = XH.darkTheme ? 'dark' : 'light';
                return `Theme toggled to ${newTheme} mode.`;
            }

            case 'open_widget_chooser': {
                appModel.showWidgetChooser = true;
                return 'Widget chooser panel opened.';
            }

            case 'show_json_spec': {
                appModel.showJsonHarness = true;
                return 'JSON spec editor opened.';
            }

            default:
                throw new Error(`Unknown tool: "${name}"`);
        }
    }
}

//--------------------------------------------------
// Tool definitions in Anthropic API format
//--------------------------------------------------
const TOOL_DEFINITIONS: ToolDefinition[] = [
    {
        name: 'save_dashboard_as_view',
        description:
            'Save the current dashboard layout as a new named view. The current dashboard state will be captured automatically.',
        input_schema: {
            type: 'object',
            properties: {
                name: {
                    type: 'string',
                    description: 'The name for the saved view (e.g. "Tokyo Overview")'
                }
            },
            required: ['name']
        }
    },
    {
        name: 'switch_to_view',
        description:
            "Switch to an existing saved view by name. The dashboard will update to show that view's layout.",
        input_schema: {
            type: 'object',
            properties: {
                name: {
                    type: 'string',
                    description: 'The name of the saved view to switch to'
                }
            },
            required: ['name']
        }
    },
    {
        name: 'reset_dashboard',
        description:
            "Reset the dashboard to the current view's last saved state, discarding any unsaved changes.",
        input_schema: {
            type: 'object',
            properties: {},
            required: []
        }
    },
    {
        name: 'toggle_theme',
        description: 'Toggle between light and dark theme for the entire application.',
        input_schema: {
            type: 'object',
            properties: {},
            required: []
        }
    },
    {
        name: 'open_widget_chooser',
        description:
            'Open the widget chooser panel so the user can manually browse and add widgets to the dashboard.',
        input_schema: {
            type: 'object',
            properties: {},
            required: []
        }
    },
    {
        name: 'show_json_spec',
        description:
            'Open the JSON spec editor panel so the user can view or manually edit the raw dashboard specification.',
        input_schema: {
            type: 'object',
            properties: {},
            required: []
        }
    }
];
