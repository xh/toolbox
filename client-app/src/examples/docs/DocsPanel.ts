import {grid} from '@xh/hoist/cmp/grid';
import {div, filler, hframe} from '@xh/hoist/cmp/layout';
import {markdown} from '@xh/hoist/cmp/markdown';
import {creates, hoistCmp} from '@xh/hoist/core';
import {panel} from '@xh/hoist/desktop/cmp/panel';
import {textInput} from '@xh/hoist/desktop/cmp/input';
import {toolbar} from '@xh/hoist/desktop/cmp/toolbar';
import {Icon} from '@xh/hoist/icon';
import React, {useCallback, useRef, useEffect} from 'react';
import {resolveDocLink} from './docRegistry';
import {DocsPanelModel} from './DocsPanelModel';
import './App.scss';

/**
 * Main panel for the Docs viewer application.
 *
 * Renders a left sidebar with searchable, tree-based documentation navigation
 * and a main content area that displays the selected document as rendered Markdown.
 */
export const [DocsPanel, docsPanel] = hoistCmp.withFactory({
    displayName: 'DocsPanel',
    model: creates(DocsPanelModel),
    className: 'tbox-docs',

    render({className}) {
        return hframe({
            className,
            items: [navPanel(), contentPanel()]
        });
    }
});

//------------------
// Nav sidebar
//------------------
const navPanel = hoistCmp.factory({
    render({model}) {
        const {gridModel, navPanelModel} = model as DocsPanelModel;
        return panel({
            model: navPanelModel,
            icon: Icon.book(),
            title: 'Documentation',
            className: 'tbox-docs__nav',
            tbar: toolbar(
                textInput({
                    bind: 'searchQuery',
                    placeholder: 'Search docs...',
                    leftIcon: Icon.search(),
                    commitOnChange: true,
                    enableClear: true,
                    flex: 1
                })
            ),
            item: grid({model: gridModel})
        });
    }
});

//------------------
// Content viewer
//------------------
const contentPanel = hoistCmp.factory({
    render({model}) {
        const {activeDoc, isLoadingContent} = model as DocsPanelModel;

        if (!activeDoc) {
            return panel({
                className: 'tbox-docs__content',
                item: div({
                    className: 'tbox-docs__empty',
                    item: 'Select a document to view'
                })
            });
        }

        return panel({
            className: 'tbox-docs__content',
            tbar: toolbar({
                className: 'tbox-docs__content-toolbar',
                items: [
                    Icon.file(),
                    div({className: 'tbox-docs__content-title', item: activeDoc.title}),
                    filler(),
                    div({
                        className: 'tbox-docs__content-desc',
                        item: activeDoc.description,
                        omit: !activeDoc.description
                    })
                ]
            }),
            item: contentBody(),
            mask: isLoadingContent
        });
    }
});

const contentBody = hoistCmp.factory(({model}) => {
    const {content, activeDoc} = model as DocsPanelModel,
        scrollRef = useRef<HTMLDivElement>(null);

    // Scroll to top when the active doc changes
    useEffect(() => {
        scrollRef.current?.scrollTo(0, 0);
    }, [activeDoc]);

    // All hooks must be called before any conditional returns
    const handleLinkClick = useCallback(
        (e: React.MouseEvent<HTMLDivElement>) => {
            const anchor = (e.target as HTMLElement).closest('a');
            if (!anchor) return;

            const href = anchor.getAttribute('href');
            if (!href) return;

            // Try to resolve as an internal doc link
            if (activeDoc && !href.startsWith('http') && !href.startsWith('#')) {
                e.preventDefault();
                const target = resolveDocLink(activeDoc.sourcePath, href);
                if (target) {
                    (model as DocsPanelModel).navigateToDoc(target.id);
                }
                // Unresolved relative links (e.g. .ts source files) are silently
                // consumed to prevent the browser from navigating away from the SPA.
                return;
            }

            // External links: open in new tab
            if (href.startsWith('http')) {
                e.preventDefault();
                window.open(href, '_blank', 'noopener');
            }
        },
        [activeDoc, model]
    );

    if (!content) return null;

    return div({
        className: 'tbox-docs__content-body',
        ref: scrollRef,
        onClick: handleLinkClick,
        item: div({
            className: 'tbox-docs__content-inner',
            item: markdown({content, lineBreaks: false})
        })
    });
});
