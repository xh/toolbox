import {tabContainer, TabContainerModel} from '@xh/hoist/cmp/tab';
import {div, p} from '@xh/hoist/cmp/layout';
import {creates, hoistCmp, HoistModel, managed} from '@xh/hoist/core';
import {Icon} from '@xh/hoist/icon';
import {segmentedControl} from '@xh/hoist/mobile/cmp/input';
import {panel} from '@xh/hoist/mobile/cmp/panel';
import {bindable} from '@xh/hoist/mobx';
import {exampleOption, exampleScreen} from '../cmp/example/ExampleScreen';
import './TabsPage.scss';

export const tabsPage = hoistCmp.factory({
    model: creates(() => TabsPageModel),

    render({model}) {
        return exampleScreen({
            title: 'Tabs',
            icon: Icon.folder(),
            description: [
                '`TabContainer` and its `TabContainerModel` render a set of switchable tabs, each with',
                'its own lazily-mounted content. The switcher can sit at the top or bottom on mobile;',
                'tabs support icons and titles.'
            ],
            options: [
                exampleOption({
                    label: 'Switcher position',
                    control: segmentedControl({
                        model,
                        bind: 'orientation',
                        fill: false,
                        options: [
                            {value: 'top', label: 'Top'},
                            {value: 'bottom', label: 'Bottom'}
                        ]
                    })
                })
            ],
            links: [
                {url: '$TB/client-app/src/mobile/tabs/TabsPage.ts', notes: 'This example.'},
                {
                    url: '$HR/cmp/tab/README.md',
                    text: 'Tabs docs',
                    notes: 'TabContainer & TabContainerModel guide.'
                }
            ],
            item: panel({
                item: tabContainer({
                    model: model.tabContainerModel,
                    switcher: {orientation: model.orientation}
                })
            })
        });
    }
});

const tabContent = (body: string) => div({className: 'tb-tabs-page__content', item: p(body)});

const overviewTab = hoistCmp.factory(() =>
    tabContent(
        'Overview tab. Each tab renders its own content and is mounted lazily on first activation.'
    )
);

const detailsTab = hoistCmp.factory(() =>
    tabContent('Details tab. Switch tabs from the switcher - try moving it top vs. bottom.')
);

const activityTab = hoistCmp.factory(() =>
    tabContent('Activity tab. Tabs can carry an icon and a title, as shown in the switcher.')
);

class TabsPageModel extends HoistModel {
    @bindable accessor orientation: 'top' | 'bottom' = 'top';

    @managed
    tabContainerModel: TabContainerModel = new TabContainerModel({
        tabs: [
            {id: 'overview', title: 'Overview', icon: Icon.info(), content: overviewTab},
            {id: 'details', title: 'Details', icon: Icon.list(), content: detailsTab},
            {id: 'activity', title: 'Activity', icon: Icon.clock(), content: activityTab}
        ]
    });
}
