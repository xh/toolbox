import type {Intent} from '@xh/hoist/core';

/** What the document bar's status pill reads from the blueprint open. */
export interface DocumentState {
    kind: 'draft' | 'publish';
    /** The draft's save counter, or the publish's number. */
    version: number;
    access: 'read' | 'write';
    isStale: boolean;
    isSaving: boolean;
    isDirty: boolean;
    /** The message of the last save's error, or null. */
    saveError: string;
    architectBusy: boolean;
}

export interface DocumentStatus {
    text: string;
    intent: Intent;
    locked: boolean;
}

/** The status pill for the blueprint open: its version and whether its edits are saved. */
export function documentStatus(s: DocumentState): DocumentStatus {
    const ret = (text: string, intent: Intent = null, locked = false) => ({text, intent, locked});
    if (s.kind === 'publish') {
        return s.access === 'write'
            ? ret(`Published v${s.version} · read only`, 'success', true)
            : ret(`Published v${s.version}`, 'success');
    }
    if (s.isStale) return ret('Not saved · changed in another tab', 'warning');
    if (s.saveError) return ret(`Not saved · ${s.saveError}`, 'danger');
    if (s.architectBusy) return ret('Architect editing…', 'primary');
    if (s.isSaving || s.isDirty) return ret('Saving…');
    return ret(`Draft v${s.version} · saved`, 'primary');
}
