import type {ChatMessage, ChatTextPart} from '@xh/hoist-chat-kit/core';
import type {ChatUiCatalog, ChatUiElement, ChatUiTextSegment} from '@xh/hoist-chat-kit/genui';
import type {OpenUiDocumentSegment} from '@xh/hoist-chat-kit/genui/openui';
import {isOpenUiDocumentSegment} from '@xh/hoist-chat-kit/genui/openui';
import type {PlainObject} from '@xh/hoist/core';
import {isArray, isEmpty, isPlainObject, isString} from 'lodash';

/**
 * How one OpenUI Lang program of a reply fared.
 *
 *  - `streaming` - the program is still being written.
 *  - `rendered` - every element rendered, and the parser dropped nothing.
 *  - `renderedWithIssues` - some of it rendered, but an element fell back, or the parser dropped
 *    a prop, a reference or a statement.
 *  - `failed` - nothing rendered.
 */
export type OpenUiProgramStatus = 'streaming' | 'rendered' | 'renderedWithIssues' | 'failed';

/** One element of a program, as the catalog sees it. */
export interface OpenUiElementReport {
    /** Id of the element: its statement name, or a path for an inline call. */
    id: string;
    /** Catalog name of its component. */
    component: string;
    /** True while its statement still streams. */
    isPartial: boolean;
    /**
     * True for an element with a prop that the program computes: from a `$variable`, a query
     * result or another expression. The kit evaluates such a prop as the program renders, so this
     * report cannot check it.
     */
    readsState: boolean;
    /** Why it renders as a fallback. Empty for an element that renders. */
    errors: string[];
}

/** What the lab's inspector shows for one OpenUI Lang program of a reply. */
export interface OpenUiProgramReport {
    /** Position of the program in the reply, from 1. */
    index: number;
    /** The program as the model wrote it. */
    source: string;
    status: OpenUiProgramStatus;
    /** The elements of the document the program became. Empty for a program with no root. */
    elements: OpenUiElementReport[];
    /** Parser errors about props and inline calls that lang-core dropped. */
    errors: string[];
    /** Names the program uses but never defines. lang-core drops each reference. */
    unresolved: string[];
    /** Statements that the root does not reach. They never render. */
    orphaned: string[];
}

/**
 * Reports on the OpenUI Lang programs in the text parts of a reply, in order, for the lab's
 * inspector.
 *
 * The catalog's text format finds each program and parses it. Its document segment carries what
 * the parser found: the props it dropped, the names it could not resolve, and the statements
 * that the root does not reach. This adds the catalog's own check of each element.
 *
 * A program that runs with state gives a document that the kit resolves as it renders. The
 * segment holds that document before any evaluation: a computed prop is absent, or holds the
 * parser's expression in place of a value. So this checks only the props a program wrote as
 * plain values, and marks an element with computed props as one that reads state.
 */
export function inspectOpenUiMessage(
    catalog: ChatUiCatalog,
    message: ChatMessage
): OpenUiProgramReport[] {
    if (!message) return [];
    const ret: OpenUiProgramReport[] = [];
    message.parts.forEach(part => {
        if (part.type !== 'text') return;
        const {text, state} = part as ChatTextPart,
            isStreaming = message.isStreaming && state === 'streaming';
        // No message or part id, so the format parses with a parser of its own. The chat's
        // message view keeps one per part, and must not share its state with this pass.
        catalog.parseText(text, {isStreaming}).forEach(segment => {
            const report = inspectSegment(catalog, segment, ret.length + 1);
            if (report) ret.push(report);
        });
    });
    return ret;
}

//------------------
// Implementation
//------------------
function inspectSegment(
    catalog: ChatUiCatalog,
    segment: ChatUiTextSegment,
    index: number
): OpenUiProgramReport {
    const base = {index, elements: [], errors: [], unresolved: [], orphaned: []};
    if (isOpenUiDocumentSegment(segment)) return inspectProgram(catalog, segment, index);
    switch (segment.type) {
        case 'placeholder':
            return {...base, source: segment.source, status: 'streaming'};
        case 'fallback':
            return {...base, source: segment.source, status: 'failed', errors: segment.errors};
        default:
            return null;
    }
}

function inspectProgram(
    catalog: ChatUiCatalog,
    segment: OpenUiDocumentSegment,
    index: number
): OpenUiProgramReport {
    const {source, isPartial, document, elementErrors = {}, openui} = segment,
        {errors, unresolved, orphaned} = openui,
        hasState = document.state != null,
        repaired = catalog.repairDocument({...document, isPartial}),
        elements = Object.entries(repaired.elements ?? {}).map(([id, element]) =>
            inspectElement(catalog, id, element, isPartial, hasState, elementErrors[id])
        ),
        failed = elements.filter(it => !isEmpty(it.errors)).length,
        hasIssues = failed > 0 || [errors, unresolved, orphaned].some(it => !isEmpty(it));

    return {
        index,
        source,
        elements,
        errors,
        unresolved,
        orphaned,
        status: isPartial
            ? 'streaming'
            : !hasIssues
              ? 'rendered'
              : failed === elements.length
                ? 'failed'
                : 'renderedWithIssues'
    };
}

function inspectElement(
    catalog: ChatUiCatalog,
    id: string,
    element: ChatUiElement,
    isProgramPartial: boolean,
    hasState: boolean,
    parserErrors: string[] = []
): OpenUiElementReport {
    const {component, props} = element,
        // In a partial program, the format marks each complete element `isPartial: false`.
        isPartial = isProgramPartial && element.isPartial !== false,
        base = {id, component, isPartial};

    // A stand-in for a statement that the parser refused has no props of its own to check.
    if (!isEmpty(parserErrors)) return {...base, readsState: false, errors: parserErrors};

    const problems = catalog.validate(component, props ?? {}, {isPartial});
    if (!hasState) return {...base, readsState: false, errors: problems};

    // Before the kit evaluates a program with state, a computed prop is either absent, which
    // reads as a missing required prop, or holds the parser's expression, an object. Neither is
    // a mistake of the program. The parser reports a required argument that is truly missing.
    const holdsExpression = hasExpression(props),
        errors = problems.filter(
            it => !REQUIRED_RE.test(it) && !(holdsExpression && GOT_OBJECT_RE.test(it))
        );
    return {...base, readsState: errors.length < problems.length, errors};
}

const REQUIRED_RE = /: required$/,
    GOT_OBJECT_RE = /, got object$/;

/** True if a value holds an expression of lang-core's parser: an object with a kind in `k`. */
function hasExpression(value: unknown): boolean {
    if (isArray(value)) return value.some(hasExpression);
    if (!isPlainObject(value)) return false;
    return isString((value as PlainObject).k) || Object.values(value).some(hasExpression);
}
