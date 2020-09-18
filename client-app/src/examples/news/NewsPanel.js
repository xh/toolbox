import {filler} from '@xh/hoist/cmp/layout';
import {storeCountLabel, storeFilterField} from '@xh/hoist/cmp/store';
import {hoistCmp, uses} from '@xh/hoist/core';
import {dataView} from '@xh/hoist/cmp/dataview';
import {select} from '@xh/hoist/desktop/cmp/input';
import {panel} from '@xh/hoist/desktop/cmp/panel';
import {NewsPanelModel} from './NewsPanelModel';
import './NewsPanelItem.scss';

export const newsPanel = hoistCmp.factory({
    model: uses(NewsPanelModel),

    render({model}) {
        return panel({
            className: 'toolbox-news-panel',
            width: '100%',
            height: '100%',
            item: dataView({
                onRowDoubleClicked
            }),
            mask: 'onLoad',
            bbar: [
                storeFilterField({
                    bind: 'storeFilterRaw',
                    onFilterChange: (f) => model.setTextFilter(f),
                    includeFields: model.SEARCH_FIELDS,
                    placeholder: 'Filter by title...'
                }),
                select({
                    bind: 'sourceFilterValues',
                    options: model.sourceOptions,
                    enableMulti: true,
                    placeholder: 'Filter by source...',
                    menuPlacement: 'top',
                    width: 380
                }),
                filler(),
                storeCountLabel({
                    store: model.viewModel.store,
                    unit: 'stories'
                })
            ]
        });
    }
});

function onRowDoubleClicked({data: record}) {
    const url = record.get('url');
    if (url) {
        window.open(url, '_blank');
    }
}