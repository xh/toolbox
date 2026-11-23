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
    /** Whether the draft's edits are saved, shown by an icon beside the text, or null to show none. */
    saveState: 'saved' | 'saving';
    /** The state in words, for the chip's tooltip. */
    tooltip: string;
}

/** The status chip for the blueprint open: its version, and whether its edits are saved. */
export function documentStatus(s: DocumentState): DocumentStatus {
    const ret = (
        text: string,
        intent: Intent = null,
        {locked = false, saveState = null as DocumentStatus['saveState'], tooltip = text} = {}
    ) => ({text, intent, locked, saveState, tooltip});
    if (s.kind === 'publish') {
        return s.access === 'write'
            ? ret(`Published v${s.version} · read only`, 'success', {locked: true})
            : ret(`Published v${s.version}`, 'success');
    }
    if (s.isStale) return ret('Not saved · edited elsewhere', 'warning');
    if (s.saveError) return ret(`Not saved · ${s.saveError}`, 'danger');
    if (s.architectBusy) {
        return ret('Architect editing…', 'primary', {saveState: 'saving', tooltip: 'Saving…'});
    }
    const saving = s.isSaving || s.isDirty;
    return ret(`Draft v${s.version}`, 'primary', {
        saveState: saving ? 'saving' : 'saved',
        tooltip: saving ? 'Saving…' : 'Saved'
    });
}
