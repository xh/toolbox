import {createParser} from '@openuidev/lang-core';
import type {ChatMessage, ChatTextPart} from '@xh/hoist-chat-kit/core';
import type {ChatUiCatalog, ChatUiElement, ChatUiTextSegment} from '@xh/hoist-chat-kit/genui';
import type {OpenUiLibrary, OpenUiLibraryOptions} from '@xh/hoist-chat-kit/genui/openui';
import {openUiToDocument, toOpenUiLibrary} from '@xh/hoist-chat-kit/genui/openui';
import {isEmpty} from 'lodash';

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
 * Reports on the OpenUI Lang programs in a reply, for the lab's inspector.
 *
 * The chat renders each program through the catalog's text format, which keeps the parser's
 * findings to itself: it logs dropped props to the console, and tells an app nothing of
 * statements that the root does not reach. So this parses each program again, with the kit's
 * `toOpenUiLibrary()` and `openUiToDocument()`, and checks each element as the catalog does.
 */
export class OpenUiProgramInspector {
    private readonly library: OpenUiLibrary;

    constructor(
        readonly catalog: ChatUiCatalog,
        libraryOptions: OpenUiLibraryOptions
    ) {
        this.library = toOpenUiLibrary(catalog, libraryOptions);
    }

    /** A report per program in the text parts of a message, in order. */
    inspectMessage(message: ChatMessage): OpenUiProgramReport[] {
        if (!message) return [];
        const ret: OpenUiProgramReport[] = [];
        message.parts.forEach(part => {
            if (part.type !== 'text') return;
            const {text, state} = part as ChatTextPart,
                isStreaming = message.isStreaming && state === 'streaming';
            // No message or part id, so the format parses with a parser of its own. The chat's
            // message view keeps one per part, and must not share its state with this pass.
            this.catalog.parseText(text, {isStreaming}).forEach(segment => {
                const report = this.inspectSegment(segment, ret.length + 1);
                if (report) ret.push(report);
            });
        });
        return ret;
    }

    //------------------
    // Implementation
    //------------------
    private inspectSegment(segment: ChatUiTextSegment, index: number): OpenUiProgramReport {
        const base = {index, elements: [], errors: [], unresolved: [], orphaned: []};
        switch (segment.type) {
            case 'placeholder':
                return {...base, source: segment.source, status: 'streaming'};
            case 'fallback':
                return {...base, source: segment.source, status: 'failed', errors: segment.errors};
            case 'document':
                return this.inspectProgram(segment.source, segment.isPartial, index);
            default:
                return null;
        }
    }

    private inspectProgram(source: string, isPartial: boolean, index: number): OpenUiProgramReport {
        const {catalog, library} = this,
            result = createParser(library.schema, library.root).parse(source),
            {document, errors, elementErrors} = openUiToDocument(result, library, {
                complete: !isPartial,
                text: source,
                catalog
            }),
            repaired = catalog.repairDocument({...document, isPartial}),
            elements = Object.entries(repaired.elements ?? {}).map(([id, element]) =>
                this.inspectElement(id, element, isPartial, elementErrors[id])
            ),
            {unresolved, orphaned} = result.meta,
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

    private inspectElement(
        id: string,
        element: ChatUiElement,
        isProgramPartial: boolean,
        parserErrors: string[] = []
    ): OpenUiElementReport {
        const {catalog} = this,
            {component, props} = element,
            // In a partial program, the format marks each complete element `isPartial: false`.
            isPartial = isProgramPartial && element.isPartial !== false,
            errors = [...parserErrors];

        // A stand-in for a statement that lang-core dropped has no props of its own to check.
        if (isEmpty(parserErrors)) {
            errors.push(...catalog.validate(component, props ?? {}, {isPartial}));
        }
        return {id, component, isPartial, errors};
    }
}
