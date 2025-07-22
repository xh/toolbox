import {a} from '@xh/hoist/cmp/layout';
import {relativeTimestamp} from '@xh/hoist/cmp/relativetimestamp';
import {hoistCmp, uses} from '@xh/hoist/core';
import {appBar, appBarSeparator} from '@xh/hoist/desktop/cmp/appbar';
import {panel} from '@xh/hoist/desktop/cmp/panel';
import {Icon} from '@xh/hoist/icon';
import {AppModel} from './AppModel';
import {newsPanel} from './NewsPanel';
import '../../core/Toolbox.scss';

export const AppComponent = hoistCmp({
    displayName: 'App',
    model: uses(AppModel),

    render({model}) {
        return panel({
            tbar: appBar({
                icon: Icon.news({size: '2x', prefix: 'fal'}),
                leftItems: [
                    a({
                        item: 'powered by NewsAPI.org',
                        href: 'https://newsapi.org/',
                        target: '_blank'
                    })
                ],
                rightItems: [
                    relativeTimestamp({
                        model: model.newsPanelModel,
                        bind: 'lastLoadCompleted',
                        prefix: 'Last Updated:'
                    }),
                    appBarSeparator()
                ],
                appMenuButtonProps: {hideLogoutItem: false}
            }),
            item: newsPanel()
        });
    }
});
