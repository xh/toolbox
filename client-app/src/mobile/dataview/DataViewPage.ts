import {creates, hoistCmp} from '@xh/hoist/core';
import {panel} from '@xh/hoist/mobile/cmp/panel';
import {select} from '@xh/hoist/mobile/cmp/input';
import {dataView} from '@xh/hoist/cmp/dataview';
import {Icon} from '@xh/hoist/icon';
import {exampleAction, exampleOption, exampleScreen} from '../cmp/example/ExampleScreen';
import {DataViewPageModel} from './DataViewPageModel';

export const dataViewPage = hoistCmp.factory({
    model: creates(DataViewPageModel),

    render({model}) {
        return exampleScreen({
            title: 'DataViews',
            icon: Icon.addressCard(),
            description: [
                '`DataView` leverages an underlying `Grid` / `GridModel` to render a custom component',
                '"card" for each record - ideal for richer, non-tabular row layouts on mobile.'
            ],
            options: [
                exampleOption({
                    label: 'Item height',
                    control: select({
                        width: 150,
                        model: model.dataViewModel,
                        bind: 'itemHeight',
                        enableFilter: false,
                        hideSelectedOptionCheck: true,
                        options: [
                            {value: 70, label: 'Standard'},
                            {value: 92, label: 'Comfortable'},
                            {value: 120, label: 'Spacious'}
                        ]
                    })
                }),
                exampleAction({
                    text: 'Load new (random) records',
                    icon: Icon.refresh(),
                    onClick: () => model.refreshAsync()
                })
            ],
            links: [
                {url: '$TB/client-app/src/mobile/dataview/DataViewPage.ts', notes: 'This example.'},
                {url: '$HR/cmp/dataview/README.md', text: 'DataView docs'}
            ],
            item: panel({mask: 'onLoad', item: dataView()})
        });
    }
});
