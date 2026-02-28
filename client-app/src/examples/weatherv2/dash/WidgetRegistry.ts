import {WidgetMeta} from './types';

/**
 * Singleton registry of all V2 widget type schemas.
 * Widget models register their static `meta` on module load.
 * Used for validation, LLM prompt generation, and inspector display.
 */
class WidgetRegistryImpl {
    private _schemas = new Map<string, WidgetMeta>();

    /** Register a widget type schema. */
    register(meta: WidgetMeta) {
        this._schemas.set(meta.id, meta);
    }

    /** Get schema for a widget type. */
    get(id: string): WidgetMeta | undefined {
        return this._schemas.get(id);
    }

    /** Get all registered widget schemas. */
    getAll(): WidgetMeta[] {
        return Array.from(this._schemas.values());
    }

    /** Get all registered widget type IDs. */
    getIds(): string[] {
        return Array.from(this._schemas.keys());
    }

    /** Check if a widget type is registered. */
    has(id: string): boolean {
        return this._schemas.has(id);
    }

    /**
     * Generate a structured text description of all widget types
     * for inclusion in the LLM system prompt.
     */
    generateLLMPrompt(): string {
        const widgets = this.getAll();
        if (!widgets.length) return 'No widget types registered.';

        return widgets
            .map(meta => {
                const lines = [
                    `### ${meta.id} — ${meta.title} [${meta.category}]`,
                    meta.description
                ];

                if (meta.inputs.length) {
                    lines.push('Inputs:');
                    for (const input of meta.inputs) {
                        const req = input.required ? 'required' : 'optional';
                        const def =
                            input.default !== undefined
                                ? `, default: ${JSON.stringify(input.default)}`
                                : '';
                        lines.push(
                            `  - ${input.name} (${input.type}, ${req}${def}) — ${input.description}`
                        );
                    }
                }

                if (meta.outputs.length) {
                    lines.push('Outputs:');
                    for (const output of meta.outputs) {
                        lines.push(`  - ${output.name} (${output.type}) — ${output.description}`);
                    }
                }

                const configEntries = Object.entries(meta.config);
                if (configEntries.length) {
                    lines.push('Config:');
                    for (const [key, def] of configEntries) {
                        const typeStr =
                            def.type === 'enum' ? `enum: ${def.enum?.join('|')}` : def.type;
                        const defStr =
                            def.default !== undefined
                                ? `, default: ${JSON.stringify(def.default)}`
                                : '';
                        lines.push(`  - ${key} (${typeStr}${defStr}) — ${def.description}`);
                    }
                }

                lines.push(`Default size: ${meta.defaultSize.w}×${meta.defaultSize.h}`);
                return lines.join('\n');
            })
            .join('\n\n');
    }
}

/** Singleton widget registry instance. */
export const widgetRegistry = new WidgetRegistryImpl();
