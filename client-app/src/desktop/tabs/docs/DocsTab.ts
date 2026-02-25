import {badge} from '@xh/hoist/cmp/badge';
import {grid} from '@xh/hoist/cmp/grid';
import {div, filler, hframe, hspacer, placeholder, span} from '@xh/hoist/cmp/layout';
import {markdown} from '@xh/hoist/cmp/markdown';
import {creates, hoistCmp, uses, XH} from '@xh/hoist/core';
import {button} from '@xh/hoist/desktop/cmp/button';
import {dockContainer} from '@xh/hoist/desktop/cmp/dock';
import {textArea, textInput} from '@xh/hoist/desktop/cmp/input';
import {panel} from '@xh/hoist/desktop/cmp/panel';
import {toolbar, toolbarSep} from '@xh/hoist/desktop/cmp/toolbar';
import {Icon} from '@xh/hoist/icon';
import {menu, menuItem, popover, tooltip} from '@xh/hoist/kit/blueprint';
import {pluralize} from '@xh/hoist/utils/js';
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
export const docsTab = hoistCmp.factory<DocsPanelModel>({
    displayName: 'DocsTab',
    model: creates(DocsPanelModel),
    className: 'tb-docs',

    render({model, className}) {
        return panel({
            className,
            hotkeys: [
                {
                    label: 'Toggle documentation search',
                    combo: 'shift + s',
                    global: true,
                    preventDefault: true,
                    onKeyDown: () => model.toggleSearchMode()
                }
            ],
            items: [
                hframe(navPanel(), contentPanel()),
                dockContainer({model: model.dockContainerModel})
            ]
        });
    }
});

//------------------
// Nav sidebar
//------------------
const navPanel = hoistCmp.factory<DocsPanelModel>({
    render({model}) {
        const {gridModel, navPanelModel} = model;
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
const contentPanel = hoistCmp.factory<DocsPanelModel>({
    render({model}) {
        const {activeDoc, loadContentTask, searchMode} = model;

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
                            onClick: () => model.enterSearchMode()
                        })
                    }),
                    breadcrumb(),
                    filler(),
                    examplesMenu(),
                    toolbarSep(),
                    button({
                        icon: Icon.comment(),
                        text: 'Feedback',
                        minimal: true,
                        onClick: () => model.openFeedbackPanel(() => feedbackPanel())
                    })
                ]
            }),
            item: contentBody(),
            mask: loadContentTask
        });
    }
});

//------------------
// Search panel
//------------------
const searchResultsBody = hoistCmp.factory<DocsPanelModel>({
    render({model}) {
        const {searchResults, searchQuery, selectedSearchIdx} = model,
            hasQuery = !!searchQuery?.trim(),
            selectedRef = useRef<HTMLDivElement>(null);

        useEffect(() => {
            selectedRef.current?.scrollIntoView({block: 'nearest'});
        }, [selectedSearchIdx]);

        if (!hasQuery) {
            return placeholder(Icon.search(), 'Type to search across all documentation content.');
        }

        if (searchResults.length === 0) {
            return searchQuery.trim().length < 3
                ? placeholder(Icon.search(), 'Keep typing to search...')
                : placeholder(Icon.skull(), 'No results found.');
        }

        return div({
            className: 'tb-docs__search-results',
            items: searchResults.map((r, idx) =>
                div({
                    key: r.entry.id,
                    ref: idx === selectedSearchIdx ? selectedRef : undefined,
                    className:
                        'tb-docs__search-result' +
                        (idx === selectedSearchIdx ? ' tb-docs__search-result--selected' : ''),
                    onClick: () => model.selectSearchResult(r.entry.id),
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

const searchPanel = hoistCmp.factory<DocsPanelModel>({
    render({model}) {
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
                            onClick: () => model.exitSearchMode()
                        })
                    }),
                    textInput({
                        bind: 'searchQuery',
                        placeholder: 'Search all documentation...',
                        leftIcon: Icon.search(),
                        commitOnChange: true,
                        enableClear: true,
                        flex: 1,
                        autoFocus: true,
                        onKeyDown: e => model.onSearchKeyDown(e)
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
const breadcrumb = hoistCmp.factory<DocsPanelModel>({
    render({model}) {
        const {activeCategory, activeDoc, sections, activeSection} = model;

        if (!activeCategory || !activeDoc) return null;

        const activeSectionTitle = activeSection
            ? sections.find(s => s.id === activeSection)?.title
            : null;

        return div({
            className: 'tb-docs__breadcrumb',
            items: [
                popover({
                    position: 'bottom-left',
                    minimal: true,
                    item: button({
                        className: 'tb-docs__breadcrumb-btn',
                        icon: model.getCategoryIcon(activeCategory.id),
                        text: activeCategory.title,
                        minimal: true
                    }),
                    content: menu(
                        ...DOC_CATEGORIES.map(cat =>
                            menuItem({
                                text: cat.title,
                                icon: model.getCategoryIcon(cat.id),
                                active: cat.id === activeCategory.id,
                                onClick: () => model.navigateToCategory(cat.id)
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
                        ...model.activeCategorySiblings.map(doc =>
                            menuItem({
                                text: doc.title,
                                active: doc.id === activeDoc.id,
                                onClick: () => model.navigateToDoc(doc.id)
                            })
                        )
                    )
                }),
                sections.length > 0
                    ? span({className: 'tb-docs__breadcrumb-sep', item: Icon.chevronRight()})
                    : null,
                sections.length > 0
                    ? popover({
                          position: 'bottom-left',
                          minimal: true,
                          item: button({
                              className: 'tb-docs__breadcrumb-btn tb-docs__breadcrumb-section',
                              icon: Icon.list(),
                              text: activeSectionTitle,
                              minimal: true
                          }),
                          content: menu(
                              ...sections.map(sec =>
                                  menuItem({
                                      text: sec.title,
                                      active: sec.id === activeSection,
                                      onClick: () => {
                                          const el = document.getElementById(sec.id);
                                          if (el) {
                                              el.scrollIntoView({
                                                  behavior: 'smooth',
                                                  block: 'start'
                                              });
                                              model.setActiveSection(sec.id);
                                          }
                                      }
                                  })
                              )
                          )
                      })
                    : null
            ]
        });
    }
});

const examplesMenu = hoistCmp.factory<DocsPanelModel>({
    render({model}) {
        const {activeDocExamples} = model;

        if (!activeDocExamples.length) return null;

        const count = activeDocExamples.length;

        if (count === 1) {
            const ex = activeDocExamples[0];
            return button({
                className: 'tb-docs__examples-btn',
                icon: Icon.code(),
                text: ex.title,
                minimal: true,
                onClick: () => XH.navigate(ex.route)
            });
        }

        return popover({
            position: 'bottom-right',
            minimal: true,
            item: button({
                className: 'tb-docs__examples-btn',
                icon: Icon.code(),
                text: pluralize('Example', count, true),
                minimal: true,
                rightIcon: Icon.chevronDown()
            }),
            content: menu(
                ...activeDocExamples.map(ex =>
                    menuItem({
                        text: ex.title,
                        icon: Icon.openExternal(),
                        onClick: () => XH.navigate(ex.route)
                    })
                )
            )
        });
    }
});

//------------------
// Feedback panel (docked compose)
//------------------
const feedbackPanel = hoistCmp.factory<DocsPanelModel>({
    model: uses(DocsPanelModel),
    render({model}) {
        const {activeDoc, activeSection, sections} = model,
            sectionTitle = activeSection ? sections.find(s => s.id === activeSection)?.title : null;

        return panel({
            className: 'tb-docs__feedback',
            tbar: toolbar({
                compact: true,
                items: [
                    span({item: activeDoc?.title ?? 'No document selected'}),
                    span({
                        items: [
                            Icon.chevronRight({className: 'xh-text-color-muted'}),
                            ` ${sectionTitle}`
                        ],
                        omit: !sectionTitle
                    })
                ]
            }),
            contentBoxProps: {padding: true},
            item: textArea({
                bind: 'feedbackMessage',
                placeholder: 'Describe the issue or suggestion...',
                width: '100%',
                height: 250,
                commitOnChange: true,
                autoFocus: true
            }),
            bbar: toolbar(
                filler(),
                button({
                    text: 'Cancel',
                    minimal: true,
                    onClick: () => model.closeFeedbackPanel()
                }),
                hspacer(5),
                button({
                    icon: Icon.mail(),
                    text: 'Send to XH',
                    intent: 'primary',
                    outlined: true,
                    disabled: !model.feedbackMessage?.trim(),
                    onClick: () => model.submitFeedbackAsync()
                })
            )
        });
    }
});

//------------------
// Content body
//------------------
const contentBody = hoistCmp.factory<DocsPanelModel>(({model}) => {
    const {content, activeDoc} = model,
        scrollRef = useRef<HTMLDivElement>(null);

    // Scroll to top when the active doc changes
    useEffect(() => {
        scrollRef.current?.scrollTo(0, 0);
    }, [activeDoc]);

    // After content renders: assign slug IDs to H2 elements and track active section.
    useEffect(() => {
        const container = scrollRef.current;
        if (!container || !content) return;

        // Assign IDs to H2s from the model's parsed sections, ensuring 1:1 correspondence.
        const headings = container.querySelectorAll('h2'),
            secs = model.sections;
        headings.forEach((h2, i) => {
            if (i < secs.length) h2.id = secs[i].id;
        });

        // Track active section based on scroll position — the last H2 that has
        // scrolled past the top of the container is considered "active".
        let ticking = false;
        const onScroll = () => {
            if (ticking) return;
            ticking = true;
            window.requestAnimationFrame(() => {
                const containerTop = container.getBoundingClientRect().top;
                let activeId: string = null;
                container.querySelectorAll('h2[id]').forEach(h2 => {
                    if (h2.getBoundingClientRect().top <= containerTop + 60) {
                        activeId = h2.id;
                    }
                });
                if (activeId !== model.activeSection) model.setActiveSection(activeId);
                ticking = false;
            });
        };
        container.addEventListener('scroll', onScroll, {passive: true});

        // If the URL has a hash fragment, scroll to the matching section.
        const hash = window.location.hash?.slice(1);
        if (hash) {
            window.requestAnimationFrame(() => {
                const target = document.getElementById(hash);
                if (target) {
                    target.scrollIntoView({block: 'start'});
                    model.setActiveSection(hash);
                }
            });
        }

        return () => container.removeEventListener('scroll', onScroll);
    }, [model, content]);

    // Handle clicks on links within the rendered markdown.
    const handleLinkClick = useCallback(
        (e: React.MouseEvent<HTMLDivElement>) => {
            const anchor = (e.target as HTMLElement).closest('a');
            if (!anchor) return;

            const href = anchor.getAttribute('href');
            if (!href) return;

            // Anchor-only links: scroll to the section within the current doc.
            if (href.startsWith('#')) {
                e.preventDefault();
                const sectionId = href.slice(1),
                    el = document.getElementById(sectionId);
                if (el) {
                    el.scrollIntoView({behavior: 'smooth', block: 'start'});
                    model.setActiveSection(sectionId);
                }
                return;
            }

            // Try to resolve as an internal doc link
            if (activeDoc && !href.startsWith('http')) {
                e.preventDefault();
                const target = resolveDocLink(activeDoc.sourcePath, href);
                if (target) model.navigateToDoc(target.id);
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
        [model, activeDoc]
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
