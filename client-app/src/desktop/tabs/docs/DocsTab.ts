import {badge} from '@xh/hoist/cmp/badge';
import {grid} from '@xh/hoist/cmp/grid';
import {div, filler, hbox, hframe, hspacer, placeholder, span} from '@xh/hoist/cmp/layout';
import {creates, hoistCmp, uses, XH} from '@xh/hoist/core';
import {button} from '@xh/hoist/desktop/cmp/button';
import {dockContainer} from '@xh/hoist/desktop/cmp/dock';
import {textArea, textInput} from '@xh/hoist/desktop/cmp/input';
import {panel} from '@xh/hoist/desktop/cmp/panel';
import {toolbar, toolbarSep} from '@xh/hoist/desktop/cmp/toolbar';
import {Icon} from '@xh/hoist/icon';
import {menu, menuItem, popover, tooltip} from '@xh/hoist/kit/blueprint';
import {pluralize} from '@xh/hoist/utils/js';
import {useEffect, useRef} from 'react';
import {docContent} from '../../../core/docs/DocContent';
import {DocsPanelModel} from './DocsPanelModel';
import {DocService} from '../../../core/svc/DocService';
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
        const {activeDoc, searchMode} = model;

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
            item: docContent(),
            mask: 'onLoad'
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

        const docService = DocService.instance;

        return div({
            className: 'tb-docs__search-results',
            items: searchResults.map((r, idx) =>
                div({
                    key: `${r.entry.source}:${r.entry.id}`,
                    ref: idx === selectedSearchIdx ? selectedRef : undefined,
                    className:
                        'tb-docs__search-result' +
                        (idx === selectedSearchIdx ? ' tb-docs__search-result--selected' : ''),
                    onClick: () => model.selectSearchResult(r.entry),
                    items: [
                        div({
                            className: 'tb-docs__search-result-header',
                            items: [
                                span({
                                    className: 'tb-docs__search-result-title',
                                    item: r.entry.title
                                }),
                                badge({item: docService.getSourceLabel(r.entry.source)}),
                                badge({
                                    item:
                                        docService
                                            .getCategories(r.entry.source)
                                            .find(c => c.id === r.entry.category)?.title ??
                                        r.entry.category
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
        const {activeCategory, activeDoc, activeSource, sections, activeSection} = model,
            docService = DocService.instance;

        if (!activeCategory || !activeDoc || !activeSource) return null;

        const sourceLabel = docService.getSourceLabel(activeSource),
            activeSectionTitle = activeSection
                ? sections.find(s => s.id === activeSection)?.title
                : null;

        return div({
            className: 'tb-docs__breadcrumb',
            items: [
                // Source label (non-interactive)
                span({
                    className: 'tb-docs__breadcrumb-source',
                    item: sourceLabel
                }),
                span({className: 'tb-docs__breadcrumb-sep', item: Icon.chevronRight()}),
                // Category dropdown - scoped to the active source's categories
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
                        ...model.activeSourceCategories.map(cat =>
                            menuItem({
                                text: cat.title,
                                icon: model.getCategoryIcon(cat.id),
                                active: cat.id === activeCategory.id,
                                onClick: () => model.navigateToCategory(activeSource, cat.id)
                            })
                        )
                    )
                }),
                span({className: 'tb-docs__breadcrumb-sep', item: Icon.chevronRight()}),
                // Doc dropdown
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
                                active: doc.id === activeDoc.id && doc.source === activeDoc.source,
                                onClick: () => model.navigateToDoc(doc.id, doc.source)
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
// Helpers
//------------------
function searchTooltip(label: string = 'Search documentation') {
    return hbox({
        alignItems: 'center',
        items: [
            label,
            hspacer(),
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
