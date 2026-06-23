import {div, filler, hbox, span, vbox} from '@xh/hoist/cmp/layout';
import {creates, hoistCmp} from '@xh/hoist/core';
import {Icon} from '@xh/hoist/icon';
import {panel} from '@xh/hoist/mobile/cmp/panel';
import {pluralize} from '@xh/hoist/utils/js';
import {DocsLandingModel} from './DocsLandingModel';
import './DocsLandingPage.scss';

/**
 * Mobile Docs landing - the corpus chooser. A tap-through search field, a one-line intro, the two
 * libraries as cards, and a "Jump back in" recently-viewed list. The app bar (blade toggle + title +
 * refresh) is provided by the app shell; this page owns the body.
 */
export const docsLandingPage = hoistCmp.factory({
    displayName: 'DocsLandingPage',
    model: creates(DocsLandingModel),

    render() {
        return panel({
            className: 'tb-docs-landing',
            scrollable: true,
            item: div({
                className: 'tb-docs-landing__body',
                items: [introBlurb(), searchTrigger(), corpusCards(), recentSection()]
            })
        });
    }
});

/** A read-only search box styled to look live; tapping it opens the dedicated search screen. */
const searchTrigger = hoistCmp.factory<DocsLandingModel>({
    render({model}) {
        return hbox({
            className: 'tb-docs-landing__search',
            onClick: () => model.openSearch(),
            items: [
                Icon.search({className: 'tb-docs-landing__search-icon'}),
                span({className: 'tb-docs-landing__search-text', item: 'Search the docs'})
            ]
        });
    }
});

const introBlurb = hoistCmp.factory(() =>
    div({
        className: 'tb-docs-landing__intro',
        item: 'Browse the Hoist documentation. Pick a library to start, or search across both.'
    })
);

const corpusCards = hoistCmp.factory<DocsLandingModel>({
    render({model}) {
        return div({
            className: 'tb-docs-landing__cards',
            items: [
                div({className: 'tb-docs-landing__section-title', item: 'Choose a library'}),
                ...model.corpora.map(c =>
                    hbox({
                        key: c.source,
                        className: 'tb-docs-landing__card',
                        onClick: () => model.openCorpus(c.source),
                        items: [
                            div({className: 'tb-docs-landing__card-icon', item: c.icon}),
                            vbox({
                                className: 'tb-docs-landing__card-text',
                                items: [
                                    div({className: 'tb-docs-landing__card-label', item: c.label}),
                                    div({
                                        className: 'tb-docs-landing__card-tagline',
                                        item: c.tagline
                                    }),
                                    div({
                                        className: 'tb-docs-landing__card-count',
                                        item: pluralize('doc', c.docCount, true)
                                    })
                                ]
                            }),
                            filler(),
                            Icon.chevronRight({className: 'tb-docs-landing__card-chevron'})
                        ]
                    })
                )
            ]
        });
    }
});

const recentSection = hoistCmp.factory<DocsLandingModel>({
    render({model}) {
        const {recentDocs} = model;
        if (!recentDocs.length) return null;
        return div({
            className: 'tb-docs-landing__recent',
            items: [
                div({className: 'tb-docs-landing__section-title', item: 'Jump back in'}),
                ...recentDocs.map(entry =>
                    hbox({
                        key: `${entry.source}:${entry.id}`,
                        className: 'tb-docs-landing__recent-row',
                        onClick: () => model.openRecent(entry),
                        items: [
                            Icon.clock({className: 'tb-docs-landing__recent-icon'}),
                            vbox({
                                className: 'tb-docs-landing__recent-text',
                                items: [
                                    div({
                                        className: 'tb-docs-landing__recent-title',
                                        item: entry.title
                                    }),
                                    div({
                                        className: 'tb-docs-landing__recent-src',
                                        item: model.getSourceLabel(entry.source)
                                    })
                                ]
                            }),
                            filler(),
                            Icon.chevronRight({className: 'tb-docs-landing__recent-chevron'})
                        ]
                    })
                )
            ]
        });
    }
});
