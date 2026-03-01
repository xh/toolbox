import {widgetRegistry} from './WidgetRegistry';
import {AppModel} from '../AppModel';

/**
 * Color palette for input widgets. Colors are assigned in order of widget
 * appearance in the dashboard. Each input widget instance gets a stable color
 * used in its header, the provider widget picker, and consumer widget headers.
 */
const INPUT_WIDGET_COLORS = [
    '#4A90D9', // Blue
    '#7B61FF', // Purple
    '#E67E22', // Orange
    '#27AE60', // Green
    '#E74C3C', // Red
    '#16A085', // Teal
    '#F39C12', // Amber
    '#8E44AD' // Violet
];

/**
 * Get the assigned color for an input widget instance.
 * Returns undefined for non-input widgets.
 */
export function getInputWidgetColor(widgetId: string): string | undefined {
    const dashModel = AppModel.instance?.weatherV2DashModel;
    if (!dashModel) return undefined;

    const canvasModel = dashModel.dashCanvasModel,
        inputVMs = canvasModel.viewModels.filter(vm => {
            const meta = widgetRegistry.get(vm.viewSpec.id);
            return meta?.category === 'input';
        });

    const idx = inputVMs.findIndex(vm => vm.id === widgetId);
    if (idx < 0) return undefined;
    return INPUT_WIDGET_COLORS[idx % INPUT_WIDGET_COLORS.length];
}

/**
 * Get all input widget colors as a map of widgetId → color.
 * Used by WeatherV2DashModel for reactive title decoration.
 */
export function getAllInputWidgetColors(): Map<string, string> {
    const dashModel = AppModel.instance?.weatherV2DashModel;
    if (!dashModel) return new Map();

    const canvasModel = dashModel.dashCanvasModel,
        result = new Map<string, string>();

    let colorIdx = 0;
    for (const vm of canvasModel.viewModels) {
        const meta = widgetRegistry.get(vm.viewSpec.id);
        if (meta?.category === 'input') {
            result.set(vm.id, INPUT_WIDGET_COLORS[colorIdx % INPUT_WIDGET_COLORS.length]);
            colorIdx++;
        }
    }
    return result;
}

/**
 * Get colors of provider widgets bound to a consuming widget.
 * Returns an array of colors for all active input bindings.
 */
export function getConsumerWidgetColors(widgetId: string): string[] {
    const dashModel = AppModel.instance?.weatherV2DashModel;
    if (!dashModel) return [];

    const canvasModel = dashModel.dashCanvasModel,
        vm = canvasModel.viewModels.find(v => v.id === widgetId);
    if (!vm) return [];

    const bindings = vm.viewState?.bindings;
    if (!bindings) return [];

    const colors: string[] = [];
    const seenProviders = new Set<string>();
    for (const binding of Object.values(bindings)) {
        if (binding && typeof binding === 'object' && 'fromWidget' in binding) {
            const providerId = (binding as any).fromWidget;
            if (!seenProviders.has(providerId)) {
                seenProviders.add(providerId);
                const color = getInputWidgetColor(providerId);
                if (color) colors.push(color);
            }
        }
    }
    return colors;
}

export {INPUT_WIDGET_COLORS};
