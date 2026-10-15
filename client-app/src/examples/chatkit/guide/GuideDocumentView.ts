import {div, h2, p} from '@xh/hoist/cmp/layout';
import {hoistCmp, uses} from '@xh/hoist/core';
import {useEffect, useRef} from 'react';
import {GuideDocumentModel} from './GuideDocumentModel';
import './GuideDocumentView.scss';

/**
 * The guideline assistant's document viewer, for the side panel of the chat workspace: the cited
 * document as a page, with the cited passage highlighted and scrolled into view. The kit's panel
 * draws the title, Back, Close and the status strip around it.
 */
export const guideDocumentView = hoistCmp.factory({
    displayName: 'GuideDocumentView',
    model: uses(GuideDocumentModel),
    className: 'tb-guide-doc',

    render({model, className}) {
        const {document, located} = model,
            scrollRef = useRef<HTMLDivElement>(null);

        // Bring the cited passage into view for each request, or show the top if it was not found.
        useEffect(() => {
            const el = scrollRef.current;
            if (!el || !document) return;
            const target = located
                ? el.querySelector(`#${CSS.escape(domId(located.passageId))}`)
                : null;
            if (target) {
                target.scrollIntoView({block: 'center'});
            } else {
                el.scrollTop = 0;
            }
        }, [document, located]);

        if (!document) return div({className});

        return div({
            ref: scrollRef,
            className,
            item: div({
                className: 'tb-guide-doc__page',
                items: [
                    h2({className: 'tb-guide-doc__title', item: document.documentName}),
                    ...document.passages.map(it =>
                        p({
                            key: it.id,
                            className:
                                it.id === located?.passageId
                                    ? 'tb-guide-doc__passage tb-guide-doc__passage--cited'
                                    : 'tb-guide-doc__passage',
                            id: domId(it.id),
                            item: it.text
                        })
                    )
                ]
            })
        });
    }
});

/** The DOM id of a passage's element. */
function domId(passageId: string): string {
    return `tb-guide-passage-${passageId}`;
}
