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
    it('shows a saved draft by its version, saved by its icon', () => {
        expect(documentStatus(draft())).toMatchObject({
            text: 'Draft v4',
            intent: 'primary',
            saveState: 'saved',
            tooltip: 'Saved'
        });
    });

    it('keeps the text while an edit is unsaved or a save is in flight, and says so by its icon', () => {
        [draft({isDirty: true}), draft({isSaving: true})].forEach(state =>
            expect(documentStatus(state)).toMatchObject({
                text: 'Draft v4',
                saveState: 'saving',
                tooltip: 'Saving…'
            })
        );
    });

    it('shows the Architect editing during its turn', () => {
        expect(documentStatus(draft({architectBusy: true, isDirty: true}))).toMatchObject({
            text: 'Architect editing…',
            intent: 'primary',
            saveState: 'saving'
        });
    });

    it('warns when the draft changed elsewhere, ahead of any save state', () => {
        expect(documentStatus(draft({isStale: true, isDirty: true}))).toMatchObject({
            text: 'Not saved · edited elsewhere',
            intent: 'warning',
            saveState: null
        });
    });

    it('shows why a save failed', () => {
        expect(documentStatus(draft({saveError: 'Name taken'}))).toMatchObject({
            text: 'Not saved · Name taken',
            intent: 'danger',
            saveState: null
        });
    });

    it('shows a publish as read only to its owner, and plain to a reader', () => {
        const pub = draft({kind: 'publish', version: 2});
        expect(documentStatus(pub)).toMatchObject({
            text: 'Published v2 · read only',
            intent: 'success',
            locked: true,
            saveState: null
        });
        expect(documentStatus({...pub, access: 'read'})).toMatchObject({
            text: 'Published v2',
            intent: 'success',
            locked: false
        });
    });
});
