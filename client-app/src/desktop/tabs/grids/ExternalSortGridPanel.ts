import {grid, gridCountLabel} from '@xh/hoist/cmp/grid';
import {filler, span} from '@xh/hoist/cmp/layout';
import {storeFilterField} from '@xh/hoist/cmp/store';
import {creates, hoistCmp} from '@xh/hoist/core';
import {
    colAutosizeButton,
    colChooserButton,
    exportButton,
    refreshButton
} from '@xh/hoist/desktop/cmp/button';
import {select} from '@xh/hoist/desktop/cmp/input';
import {panel} from '@xh/hoist/desktop/cmp/panel';
import {toolbar} from '@xh/hoist/desktop/cmp/toolbar';
import {Icon} from '@xh/hoist/icon';
import {wrapper} from '../../common';
import {ExternalSortGridPanelModel} from './ExternalSortGridPanelModel';

export const externalSortGridPanel = hoistCmp.factory({
    model: creates(ExternalSortGridPanelModel),
    render() {
        return wrapper({
            title: 'External Sort',
            icon: Icon.gridPanel(),
            description: [
                'Grids can optionally manage their sort externally. In the below example, we',
                'react to `GridModel.sortBy` to offload sorting to external logic. Sorted rows',
                'can be limited after sorting, facilitating showing a subset of large',
                'datasets.',
                '',
                'This pattern could be used to similarly offload sorting to the server.'
            ],
            links: [
                {
                    url: '$TB/client-app/src/desktop/tabs/grids/ExternalSortGridPanel.ts',
                    notes: 'This example.'
                },
                {
                    url: '$HR/cmp/grid/README.md',
                    text: 'Grid docs',
                    notes: 'Grid component guide and core concepts.'
                },
                {
                    url: '$HR/cmp/grid/GridModel.ts',
                    notes: 'Observe GridModel.sortBy to drive externally-managed sorting.'
                }
            ],
            // Grid display options intentionally omitted here - not relevant to the sort demo.
            item: panel({
                className: 'tb-grid-wrapper-panel tb-external-sort-panel',
                mask: 'onLoad',
                tbar: tbar(),
                item: grid()
            })
        });
    }
});

const tbar = hoistCmp.factory<ExternalSortGridPanelModel>(() => {
    return toolbar(
        refreshButton(),
        '-',
        span('Max rows:'),
        select({
            bind: 'maxRows',
            options: [
                {value: null, label: 'None'},
                {value: 50, label: '50'},
                {value: 100, label: '100'},
                {value: 500, label: '500'}
            ],
            width: 100,
            enableFilter: false
        }),
        filler(),
        gridCountLabel({unit: 'companies'}),
        '-',
        storeFilterField(),
        '-',
        colAutosizeButton(),
        colChooserButton(),
        exportButton()
    );
});
