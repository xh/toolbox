import {grid} from '@xh/hoist/cmp/grid';
import {filler} from '@xh/hoist/cmp/layout';
import {storeFilterField} from '@xh/hoist/cmp/store';
import {creates, hoistCmp} from '@xh/hoist/core';
import {Icon} from '@xh/hoist/icon';
import {colAutosizeButton, colChooserButton} from '@xh/hoist/mobile/cmp/button';
import {select, switchInput} from '@xh/hoist/mobile/cmp/input';
import {panel} from '@xh/hoist/mobile/cmp/panel';
import {exampleOption, exampleScreen} from '../cmp/example/ExampleScreen';
import {GridPageModel} from './GridPageModel';

export const gridPage = hoistCmp.factory({
    model: creates(GridPageModel),

    render({model}) {
        const {gridModel} = model;
        return exampleScreen({
            title: 'Grid',
            icon: Icon.gridPanel(),
            description: [
                '`Grid` and its `GridModel` are at the heart of many Hoist applications, providing a',
                'powerful, exhaustively-configurable way to display tabular data backed by a `Store`.',
                '',
                'Use the options here to toggle common display settings - the changes apply live to the',
                'grid behind this sheet.'
            ],
            options: [
                exampleOption({
                    label: 'Sizing mode',
                    control: select({
                        width: 140,
                        model: gridModel,
                        bind: 'sizingMode',
                        options: [
                            {label: 'Tiny', value: 'tiny'},
                            {label: 'Compact', value: 'compact'},
                            {label: 'Standard', value: 'standard'},
                            {label: 'Large', value: 'large'}
                        ]
                    })
                }),
                exampleOption({
                    label: 'Row borders',
                    control: switchInput({model: gridModel, bind: 'rowBorders'})
                }),
                exampleOption({
                    label: 'Cell borders',
                    control: switchInput({model: gridModel, bind: 'cellBorders'})
                }),
                exampleOption({
                    label: 'Stripe rows',
                    control: switchInput({model: gridModel, bind: 'stripeRows'})
                }),
                exampleOption({
                    label: 'Hide headers',
                    control: switchInput({model: gridModel, bind: 'hideHeaders'})
                })
            ],
            links: [
                {url: '$TB/client-app/src/mobile/grids/GridPage.ts', notes: 'This example.'},
                {
                    url: '$HR/cmp/grid/README.md',
                    text: 'Grid docs',
                    notes: 'Component guide & core concepts'
                },
                {
                    url: 'https://www.ag-grid.com/javascript-data-grid/',
                    text: 'AG Grid docs',
                    notes: 'Underlying library - opens browser'
                }
            ],
            item: panel({
                mask: 'onLoad',
                tbar: [storeFilterField(), filler(), colAutosizeButton(), colChooserButton()],
                item: grid()
            })
        });
    }
});
