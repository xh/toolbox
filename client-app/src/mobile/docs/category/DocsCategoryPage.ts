import {div} from '@xh/hoist/cmp/layout';
import {creates, hoistCmp} from '@xh/hoist/core';
import {Icon} from '@xh/hoist/icon';
import {panel} from '@xh/hoist/mobile/cmp/panel';
import {pluralize} from '@xh/hoist/utils/js';
import {docsListRow} from '../cmp/DocsListRow';
import {DocsCategoryModel} from './DocsCategoryModel';

/**
 * Category document-list screen - the second push. Lists the docs in the chosen category; tapping
 * one opens the reader (back returns here). The app-bar back chevron carries the corpus name.
 */
export const docsCategoryPage = hoistCmp.factory({
    displayName: 'DocsCategoryPage',
    model: creates(DocsCategoryModel),

    render({model}) {
        const {category, docs} = model,
            title = category?.title ?? 'Documents';
        return panel({
            className: 'tb-docs-list',
            scrollable: true,
            item: div({
                items: [
                    div({
                        className: 'tb-docs-list__header',
                        items: [
                            div({className: 'tb-docs-list__header-title', item: title}),
                            div({
                                className: 'tb-docs-list__header-sub',
                                item: pluralize('document', docs.length, true)
                            })
                        ]
                    }),
                    ...docs.map(doc =>
                        docsListRow({
                            key: `${doc.source}:${doc.id}`,
                            icon: Icon.fileText(),
                            title: doc.title,
                            subtitle: doc.description,
                            onClick: () => model.openDoc(doc)
                        })
                    )
                ]
            })
        });
    }
});
