import {badge} from '@xh/hoist/cmp/badge';
import {div, filler, hbox, span} from '@xh/hoist/cmp/layout';
import {creates, hoistCmp, HoistProps} from '@xh/hoist/core';
import {Icon} from '@xh/hoist/icon';
import {textInput} from '@xh/hoist/mobile/cmp/input';
import {panel} from '@xh/hoist/mobile/cmp/panel';
import {toolbar} from '@xh/hoist/mobile/cmp/toolbar';
import {ReactNode} from 'react';
import {DocService, DocSearchResult} from '../../../core/svc/DocService';
import {DocsSearchModel} from './DocsSearchModel';
import './DocsSearchPage.scss';

/**
 * Dedicated docs search screen. The empty state lists recent searches; as the user types, live
 * results replace them - spanning both corpuses and grouped under their library. Each hit shows the
 * matched term highlighted, a category > doc breadcrumb, and the matched content line; tapping opens
 * the reader. The app-bar back chevron (from the shell) returns to the landing.
 */
export const docsSearchPage = hoistCmp.factory({
    displayName: 'DocsSearchPage',
    model: creates(DocsSearchModel),

    render({model}) {
        return panel({
            className: 'tb-docs-search',
            tbar: toolbar({
                className: 'tb-docs-search__bar',
                item: textInput({
                    className: 'tb-docs-search__input',
                    bind: 'query',
                    commitOnChange: true,
                    enableClear: true,
                    leftIcon: Icon.search(),
                    placeholder: 'Search the docs'
                })
            }),
            scrollable: true,
            item: model.hasQuery ? results() : recents()
        });
    }
});

//------------------------
// Empty state - recent searches
//------------------------
const recents = hoistCmp.factory<DocsSearchModel>({
    render({model}) {
        const {recentSearches} = model;
        if (!recentSearches.length) {
            return div({
                className: 'tb-docs-search__empty',
                items: [Icon.search({size: '2x'}), span('Search across both libraries.')]
            });
        }
        return div({
            className: 'tb-docs-search__recents',
            items: [
                div({className: 'tb-docs-search__group-header', item: 'Recent searches'}),
                ...recentSearches.map(term =>
                    hbox({
                        key: term,
                        className: 'tb-docs-search__recent-row',
                        onClick: () => model.runRecent(term),
                        items: [
                            Icon.clock({className: 'tb-docs-search__recent-icon'}),
                            span({className: 'tb-docs-search__recent-term', item: term}),
                            filler(),
                            div({
                                className: 'tb-docs-search__recent-remove',
                                onClick: e => {
                                    e.stopPropagation();
                                    model.removeRecent(term);
                                },
                                item: Icon.x()
                            })
                        ]
                    })
                )
            ]
        });
    }
});

//------------------------
// Results - grouped by library
//------------------------
const results = hoistCmp.factory<DocsSearchModel>({
    render({model}) {
        const {groupedResults} = model;
        if (!groupedResults.length) {
            return div({
                className: 'tb-docs-search__empty',
                items: [Icon.search({size: '2x'}), span('No matching docs.')]
            });
        }
        return div({
            className: 'tb-docs-search__results',
            items: groupedResults.map(g =>
                div({
                    key: g.source,
                    className: 'tb-docs-search__group',
                    items: [
                        div({
                            className: 'tb-docs-search__group-header',
                            items: [span(g.label), badge({item: g.results.length})]
                        }),
                        ...g.results.map(r =>
                            resultRow({key: `${r.entry.source}:${r.entry.id}`, result: r})
                        )
                    ]
                })
            )
        });
    }
});

interface ResultRowProps extends HoistProps<DocsSearchModel> {
    result: DocSearchResult;
}

const resultRow = hoistCmp.factory<ResultRowProps>({
    render({model, result}) {
        const {entry, snippet, matchedTerms = []} = result,
            categoryTitle =
                DocService.instance.getCategories(entry.source).find(c => c.id === entry.category)
                    ?.title ?? entry.category;

        return div({
            className: 'tb-docs-search__hit',
            onClick: () => model.selectResult(entry),
            items: [
                div({
                    className: 'tb-docs-search__hit-title',
                    items: highlight(entry.title, matchedTerms)
                }),
                hbox({
                    className: 'tb-docs-search__hit-crumb',
                    items: [
                        span(categoryTitle),
                        Icon.chevronRight({className: 'tb-docs-search__hit-crumb-sep'}),
                        span(entry.title)
                    ]
                }),
                snippet
                    ? div({
                          className: 'tb-docs-search__hit-snippet',
                          items: highlight(snippet, matchedTerms)
                      })
                    : null
            ]
        });
    }
});

/**
 * Split `text` on any of the given terms (case-insensitive) and wrap the matches in a highlight
 * span. `String.split` with a single capturing group yields match fragments at the odd indices.
 */
function highlight(text: string, terms: string[]): ReactNode[] {
    const escaped = terms.map(t => t.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).filter(Boolean);
    if (!escaped.length) return [text];

    const re = new RegExp(`(${escaped.join('|')})`, 'ig');
    return text
        .split(re)
        .map((part, i) =>
            i % 2 === 1 ? span({key: i, className: 'tb-docs-search__hl', item: part}) : part
        );
}
