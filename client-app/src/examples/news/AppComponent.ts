import {a, p} from '@xh/hoist/cmp/layout';
import {relativeTimestamp} from '@xh/hoist/cmp/relativetimestamp';
import {XH, hoistCmp, uses} from '@xh/hoist/core';
import {appBar, appBarSeparator} from '@xh/hoist/desktop/cmp/appbar';
import {panel} from '@xh/hoist/desktop/cmp/panel';
import {Icon} from '@xh/hoist/icon';
import {AppModel} from './AppModel';
import {newsPanel} from './NewsPanel';
import '../../core/Toolbox.scss';
import {errorMessage} from '@xh/hoist/desktop/cmp/error';

export const AppComponent = hoistCmp({
    displayName: 'App',
    model: uses(AppModel),

    render({model}) {
        let newsErrorThrown = model.newsPanelModel.newsErrorThrown;
        if (newsErrorThrown && !newsErrorThrown['isRoutine']) {
            XH.handleException(newsErrorThrown, {showAlert: false, showAsError: false});
        }

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
                        options: {prefix: 'Last Updated:'}
                    }),
                    appBarSeparator()
                ],
                appMenuButtonProps: {hideLogoutItem: false}
            }),
            items: [newsErrorPanel({error: newsErrorThrown}), newsPanel({omit: !!newsErrorThrown})]
        });
    }
});

const newsErrorPanel = hoistCmp.factory(({error}) => {
    return errorMessage({
        omit: !error,
        error: error,
        title: 'Error loading news panel',
        message: error?.['isRoutine']
            ? p(error?.['message'])
            : 'A non-routine exception occurred when loading this panel. Please try again later.'
    });
});
