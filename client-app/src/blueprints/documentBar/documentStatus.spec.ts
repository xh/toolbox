import {describe, expect, it} from 'vitest';
import {documentStatus} from './documentStatus';
import type {DocumentState} from './documentStatus';

const draft = (over: Partial<DocumentState> = {}): DocumentState => ({
    kind: 'draft',
    version: 4,
    access: 'write',
    isStale: false,
    isSaving: false,
    isDirty: false,
    saveError: null,
    architectBusy: false,
    ...over
});

describe('documentStatus', () => {
    it('shows a saved draft with its version', () => {
        expect(documentStatus(draft())).toMatchObject({
            text: 'Draft v4 · saved',
            intent: 'primary'
        });
    });

    it('shows Saving while an edit is unsaved or a save is in flight', () => {
        expect(documentStatus(draft({isDirty: true})).text).toBe('Saving…');
        expect(documentStatus(draft({isSaving: true})).text).toBe('Saving…');
    });

    it('shows the Architect editing during its turn', () => {
        expect(documentStatus(draft({architectBusy: true, isDirty: true}))).toMatchObject({
            text: 'Architect editing…',
            intent: 'primary'
        });
    });

    it('warns when the draft changed elsewhere, ahead of any save state', () => {
        expect(documentStatus(draft({isStale: true, isDirty: true}))).toMatchObject({
            text: 'Not saved · changed in another tab',
            intent: 'warning'
        });
    });

    it('shows why a save failed', () => {
        expect(documentStatus(draft({saveError: 'Name taken'}))).toMatchObject({
            text: 'Not saved · Name taken',
            intent: 'danger'
        });
    });

    it('shows a publish as read only to its owner, and plain to a reader', () => {
        const pub = draft({kind: 'publish', version: 2});
        expect(documentStatus(pub)).toMatchObject({
            text: 'Published v2 · read only',
            intent: 'success',
            locked: true
        });
        expect(documentStatus({...pub, access: 'read'})).toMatchObject({
            text: 'Published v2',
            intent: 'success',
            locked: false
        });
    });
});
