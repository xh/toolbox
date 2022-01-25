import {a, filler} from '@xh/hoist/cmp/layout';
import {toolbar} from '@xh/hoist/desktop/cmp/toolbar';
import {storeCountLabel, storeFilterField} from '@xh/hoist/cmp/store';
import {creates, hoistCmp} from '@xh/hoist/core';
import {dataView} from '@xh/hoist/cmp/dataview';
import {select} from '@xh/hoist/desktop/cmp/input';
import {panel} from '@xh/hoist/desktop/cmp/panel';
import '../../../examples/news/NewsPanelItem.scss';
import {NewsPanelModel} from '../../../examples/news/NewsPanelModel';
import {relativeTimestamp} from '@xh/hoist/cmp/relativetimestamp';
import {Icon} from '@xh/hoist/icon';
import {appBar, appBarSeparator} from '@xh/hoist/desktop/cmp/appbar';

export const newsPanel = hoistCmp.factory({
    model: creates(NewsPanelModel),
    render({model}) {
        return panel({
            className: 'toolbox-news-panel',
            tbar: appBar({
                title: 'XH News',
                icon: Icon.news({size: '2x', prefix: 'fal'}),
                leftItems: [
                    a({
                        item: 'powered by NewsAPI.org',
                        href: 'https://newsapi.org/'
                    })
                ],
                rightItems: [
                    relativeTimestamp({
                        bind: 'lastLoadCompleted',
                        options: {prefix: 'Last Updated:'}
                    }),
                    appBarSeparator()
                ],
                hideAppMenuButton: true,
                hideWhatsNewButton: true
            }),
            item: dataView(),
            mask: 'onLoad',
            bbar: bbar()
        });
    }
});

const bbar = hoistCmp.factory({
    render({model}) {
        const {store} = model.viewModel;
        return toolbar(
            storeFilterField({
                store,
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
            storeCountLabel({store, unit: 'stories'})
        );
    }
});