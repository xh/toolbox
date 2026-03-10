import {grid, gridCountLabel} from '@xh/hoist/cmp/grid';
import {filler, hframe, p, span} from '@xh/hoist/cmp/layout';
import {creates, hoistCmp} from '@xh/hoist/core';
import {filterBuilder, filterChooser} from '@xh/hoist/desktop/cmp/filter';
import {switchInput} from '@xh/hoist/desktop/cmp/input';
import {panel} from '@xh/hoist/desktop/cmp/panel';
import {toolbar} from '@xh/hoist/desktop/cmp/toolbar';
import {Icon} from '@xh/hoist/icon';
import {wrapper} from '../../common';
import {FilterBuilderPanelModel} from './FilterBuilderPanelModel';

export const filterBuilderPanel = hoistCmp.factory({
    model: creates(FilterBuilderPanelModel),
    render({model}) {
        return wrapper({
            description: [
                p(
                    "FilterBuilder provides a visual query builder for constructing filters of arbitrary complexity. It supports nested AND/OR groups with NOT negation, type-appropriate value editors, and full integration with Hoist's filter binding system."
                ),
                p(
                    'This example shows a FilterBuilder and FilterChooser both bound to the same store, demonstrating bi-directional sync. Changes in one are reflected in the other.'
                )
            ],
            links: [
                {
                    url: '$TB/client-app/src/desktop/tabs/grids/FilterBuilderPanel.ts',
                    notes: 'This example.'
                },
                {
                    url: '$HR/cmp/filter/FilterBuilderModel.ts',
                    notes: 'Hoist model for FilterBuilder component.'
                },
                {
                    url: '$HR/desktop/cmp/filter/FilterBuilder.ts',
                    notes: 'Desktop FilterBuilder component.'
                }
            ],
            item: panel({
                title: 'Grids \u203A FilterBuilder',
                icon: Icon.filter(),
                className: 'tb-grid-wrapper-panel',
                tbar: tbar(),
                item: hframe({
                    flex: 1,
                    items: [
                        filterBuilder({
                            model: model.filterBuilderModel,
                            flex: 1,
                            minWidth: 300,
                            maxWidth: 500,
                            testId: 'filter-builder'
                        }),
                        grid({flex: 2, className: 'xh-border-left'})
                    ]
                }),
                bbar: bbar()
            })
        });
    }
});

const tbar = hoistCmp.factory<FilterBuilderPanelModel>(({model}) =>
    toolbar(
        filterChooser({
            model: model.filterChooserModel,
            flex: 1,
            enableClear: true,
            placeholder: 'Companion FilterChooser (synced to same store)...'
        })
    )
);

const bbar = hoistCmp.factory<FilterBuilderPanelModel>(({model}) =>
    toolbar(
        span('Commit on Change'),
        switchInput({
            model: model.filterBuilderModel,
            bind: 'commitOnChange'
        }),
        span('Favorites'),
        switchInput({
            bind: 'enableFavorites'
        }),
        filler(),
        gridCountLabel()
    )
);
