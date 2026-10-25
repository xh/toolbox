import {div} from '@xh/hoist/cmp/layout';
import {creates, hoistCmp} from '@xh/hoist/core';
import {panel} from '@xh/hoist/mobile/cmp/panel';
import {pluralize} from '@xh/hoist/utils/js';
import {docsListRow} from '../cmp/DocsListRow';
import {DocsCorpusModel} from './DocsCorpusModel';

/**
 * Corpus category-list screen - the first push from the landing. Shows the chosen library's
 * populated categories; tapping one drills into its document list. The app-bar back chevron
 * (provided by the shell) carries the parent name ("Docs").
 */
export const docsCorpusPage = hoistCmp.factory({
    displayName: 'DocsCorpusPage',
    model: creates(DocsCorpusModel),

    render({model}) {
        const {label, docCount, categoryCount, categories} = model;
        return panel({
            className: 'tb-docs-list',
            scrollable: true,
            item: div({
                items: [
                    div({
                        className: 'tb-docs-list__header',
                        items: [
                            div({className: 'tb-docs-list__header-title', item: label}),
                            div({
                                className: 'tb-docs-list__header-sub',
                                item: `${pluralize('doc', docCount, true)} · ${pluralize('category', categoryCount, true)}`
                            })
                        ]
                    }),
                    ...categories.map(cat =>
                        docsListRow({
                            key: cat.id,
                            icon: cat.icon,
                            title: cat.title,
                            count: cat.docCount,
                            onClick: () => model.openCategory(cat.id)
                        })
                    )
                ]
            })
        });
    }
});
