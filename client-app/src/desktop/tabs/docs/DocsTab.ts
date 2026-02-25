import {badge} from '@xh/hoist/cmp/badge';
import {grid} from '@xh/hoist/cmp/grid';
import {div, filler, hframe, placeholder, span} from '@xh/hoist/cmp/layout';
import {markdown} from '@xh/hoist/cmp/markdown';
import {creates, hoistCmp} from '@xh/hoist/core';
import {button} from '@xh/hoist/desktop/cmp/button';
import {textInput} from '@xh/hoist/desktop/cmp/input';
import {panel} from '@xh/hoist/desktop/cmp/panel';
import {toolbar} from '@xh/hoist/desktop/cmp/toolbar';
import {Icon} from '@xh/hoist/icon';
import {menu, menuItem, popover, tooltip} from '@xh/hoist/kit/blueprint';
import React, {useCallback, useEffect, useRef} from 'react';
import {DOC_CATEGORIES, resolveDocLink} from './docRegistry';
import {DocsPanelModel} from './DocsPanelModel';
import './DocsTab.scss';

/**
 * Main panel for the Docs viewer tab.
 *
 * Renders a left sidebar with tree-based documentation navigation
 * and a main content area that displays the selected document as rendered Markdown,
 * or a full-text search results view when search mode is active.
 */
export const docsTab = hoistCmp.factory({
    displayName: 'DocsTab',
    model: creates(DocsPanelModel),
    className: 'tb-docs',

    render({model, className}) {
        const m = model as DocsPanelModel;
        return panel({
            className,
            hotkeys: [
                {
                    label: 'Toggle documentation search',
                    combo: 'shift + s',
                    global: true,
                    preventDefault: true,
                    onKeyDown: () => m.toggleSearchMode()
                }
            ],
            item: hframe(navPanel(), contentPanel())
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
            collapsedIcon: Icon.book(),
            collapsedTitle: 'Documentation',
            compactHeader: true,
            className: 'tb-docs__nav',
            item: grid({model: gridModel})
        });
    }
});

//------------------
// Content viewer
//------------------
const contentPanel = hoistCmp.factory({
    render({model}) {
        const m = model as DocsPanelModel,
            {activeDoc, isLoadingContent, searchMode} = m;

        if (searchMode) return searchPanel();

        if (!activeDoc) {
            return panel({
                className: 'tb-docs__content',
                item: placeholder(Icon.book(), 'Select a document to view.')
            });
        }

        return panel({
            className: 'tb-docs__content',
            tbar: toolbar({
                className: 'tb-docs__content-toolbar',
                items: [
                    tooltip({
                        content: searchTooltip(),
                        hoverOpenDelay: 500,
                        placement: 'bottom',
                        popoverClassName: 'tb-docs-tooltip',
                        item: button({
                            icon: Icon.search(),
                            minimal: true,
                            onClick: () => m.enterSearchMode()
                        })
                    }),
                    breadcrumb(),
                    filler(),
                    descBadge()
                ]
            }),
            item: contentBody(),
            mask: isLoadingContent
        });
    }
});

//------------------
// Search panel
//------------------
const searchResultsBody = hoistCmp.factory({
    render({model}) {
        const m = model as DocsPanelModel,
            {searchResults, searchQuery} = m,
            hasQuery = !!searchQuery?.trim();

        if (!hasQuery) {
            return placeholder(Icon.search(), 'Type to search across all documentation content.');
        }

        if (searchResults.length === 0) {
            return placeholder(Icon.skull(), 'No results found.');
        }

        return div({
            className: 'tb-docs__search-results',
            items: searchResults.map(r =>
                div({
                    key: r.entry.id,
                    className: 'tb-docs__search-result',
                    onClick: () => m.selectSearchResult(r.entry.id),
                    items: [
                        div({
                            className: 'tb-docs__search-result-header',
                            items: [
                                span({
                                    className: 'tb-docs__search-result-title',
                                    item: r.entry.title
                                }),
                                badge({
                                    item:
                                        DOC_CATEGORIES.find(c => c.id === r.entry.category)
                                            ?.title ?? r.entry.category
                                })
                            ]
                        }),
                        div({
                            className: 'tb-docs__search-result-desc',
                            item: r.entry.description
                        })
                    ]
                })
            )
        });
    }
});

const searchPanel = hoistCmp.factory({
    render({model}) {
        const m = model as DocsPanelModel;

        return panel({
            className: 'tb-docs__content',
            tbar: toolbar({
                className: 'tb-docs__content-toolbar',
                items: [
                    tooltip({
                        content: searchTooltip('Back to document'),
                        hoverOpenDelay: 400,
                        placement: 'bottom',
                        popoverClassName: 'tb-docs-tooltip',
                        item: button({
                            icon: Icon.arrowLeft(),
                            minimal: true,
                            onClick: () => m.exitSearchMode()
                        })
                    }),
                    textInput({
                        bind: 'searchQuery',
                        placeholder: 'Search all documentation...',
                        leftIcon: Icon.search(),
                        commitOnChange: true,
                        enableClear: true,
                        flex: 1,
                        autoFocus: true
                    })
                ]
            }),
            item: searchResultsBody()
        });
    }
});

//------------------
// Breadcrumb toolbar
//------------------
const breadcrumb = hoistCmp.factory({
    render({model}) {
        const m = model as DocsPanelModel,
            {activeCategory, activeDoc} = m;

        if (!activeCategory || !activeDoc) return null;

        return div({
            className: 'tb-docs__breadcrumb',
            items: [
                popover({
                    position: 'bottom-left',
                    minimal: true,
                    item: button({
                        className: 'tb-docs__breadcrumb-btn',
                        icon: m.getCategoryIcon(activeCategory.id),
                        text: activeCategory.title,
                        minimal: true
                    }),
                    content: menu(
                        ...DOC_CATEGORIES.map(cat =>
                            menuItem({
                                text: cat.title,
                                icon: m.getCategoryIcon(cat.id),
                                active: cat.id === activeCategory.id,
                                onClick: () => m.navigateToCategory(cat.id)
                            })
                        )
                    )
                }),
                span({className: 'tb-docs__breadcrumb-sep', item: Icon.chevronRight()}),
                popover({
                    position: 'bottom-left',
                    minimal: true,
                    item: button({
                        className: 'tb-docs__breadcrumb-btn',
                        text: activeDoc.title,
                        minimal: true
                    }),
                    content: menu(
                        ...m.activeCategorySiblings.map(doc =>
                            menuItem({
                                text: doc.title,
                                active: doc.id === activeDoc.id,
                                onClick: () => m.navigateToDoc(doc.id)
                            })
                        )
                    )
                })
            ]
        });
    }
});

const descBadge = hoistCmp.factory({
    render({model}) {
        const {activeDoc} = model as DocsPanelModel;
        if (!activeDoc?.description) return null;
        return div({
            className: 'tb-docs__content-desc',
            item: activeDoc.description
        });
    }
});

//------------------
// Content body
//------------------
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
        className: 'tb-docs__content-body',
        ref: scrollRef,
        onClick: handleLinkClick,
        item: div({
            className: 'tb-docs__content-inner',
            item: markdown({content, lineBreaks: false})
        })
    });
});

//------------------
// Helpers
//------------------
function searchTooltip(label: string = 'Search documentation') {
    return span({
        style: {whiteSpace: 'nowrap'},
        items: [
            label + ' ',
            span({
                className: 'bp6-key-combo',
                style: {display: 'inline-flex'},
                items: [
                    span({className: 'bp6-key', item: 'Shift'}),
                    span({className: 'bp6-key', item: 'S'})
                ]
            })
        ]
    });
}
