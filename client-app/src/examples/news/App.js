import {hoistCmp, uses} from '@xh/hoist/core';
import {panel} from '@xh/hoist/desktop/cmp/panel';
import {Icon} from '@xh/hoist/icon';
import {appBar} from '@xh/hoist/desktop/cmp/appbar';
import {ContextMenuItem as CM} from '@xh/hoist/desktop/cmp/contextmenu';
import {newsPanel} from './NewsPanel';
import {relativeTimestamp} from '@xh/hoist/cmp/relativetimestamp';
import {AppModel} from './AppModel';

export const App = hoistCmp({
    displayName: 'App',
    model: uses(AppModel),

    render({model}) {
        return panel({
            contextMenu: [CM.reloadApp(), CM.about(), CM.logout()],
            tbar: appBar({
                icon: Icon.news({size: '2x', prefix: 'fal'}),
                title: 'News Feed',
                hideRefreshButton: false,
                rightItems: [
                    relativeTimestamp({
                        model: model.newsPanelModel,
                        bind: 'lastRefresh',
                        options: {prefix: 'Last Updated:'}
                    })
                ]
            }),
            item: newsPanel()
        });
    }
});
