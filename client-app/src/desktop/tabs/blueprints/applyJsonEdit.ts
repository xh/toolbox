import type {Blueprint, BlueprintIssue, BlueprintModel} from '@xh/hoist-chat-kit/blueprint';
import {diffOps} from '@xh/hoist-chat-kit/blueprint';

export interface JsonEditResult {
    /** Why the text is not JSON, if it isn't. */
    parseError?: string;
    /** The errors that refused the edit. Empty when it applied, or changed nothing. */
    issues: BlueprintIssue[];
}

/**
 * Apply edited blueprint JSON as one edit, "Edit JSON", so it takes a version and a place in
 * history like any other. Text equal to the blueprint applies nothing.
 */
export function applyJsonEdit(model: BlueprintModel, json: string): JsonEditResult {
    let edited: Blueprint;
    try {
        edited = JSON.parse(json);
    } catch (e) {
        return {parseError: e.message, issues: []};
    }
    const ops = diffOps(model.blueprint ?? ({} as Blueprint), edited);
    if (!ops.length) return {issues: []};

    const {version, issues} = model.applyEdit({base: model.version, description: 'Edit JSON', ops});
    return {issues: version == null ? issues.filter(it => it.severity === 'error') : []};
}
