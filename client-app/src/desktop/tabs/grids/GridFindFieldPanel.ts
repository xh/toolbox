import type {GridModel} from '@xh/hoist/cmp/grid';
import {filler} from '@xh/hoist/cmp/layout';
import type {LoadSpec} from '@xh/hoist/core';
import {creates, hoistCmp, HoistModel, managed} from '@xh/hoist/core';
import type {FilterMatchMode} from '@xh/hoist/data';
import {button} from '@xh/hoist/desktop/cmp/button';
import type {GridFindFieldProps} from '@xh/hoist/desktop/cmp/grid';
import {gridFindField} from '@xh/hoist/desktop/cmp/grid';
import {select} from '@xh/hoist/desktop/cmp/input';
import {toolbarSep} from '@xh/hoist/desktop/cmp/toolbar';
import {Icon} from '@xh/hoist/icon';
import {bindable} from '@xh/hoist/mobx';
import type {ReactNode} from 'react';
import {
    demoPanel,
    demoPlayground,
    demoRow,
    demoSection,
    demoToolbar,
    fmtDemoConfig,
    raw
} from '../../common/Demo';
import {wrapper, wrapperOption, wrapperOptionGroup} from '../../common/Wrapper';
import {MATCH_MODE_OPTIONS} from './helpers/MatchModes';
import {createTradesGridModel, loadTradesAsync, tradesGridFrame} from './helpers/TradesGrid';

export const gridFindFieldPanel = hoistCmp.factory({
    displayName: 'GridFindFieldPanel',
    model: creates(() => GridFindFieldPanelModel),

    render({model}) {
        return wrapper({
            title: 'GridFindField',
            icon: Icon.search(),
            description: [
                "`GridFindField` is a grid's find box. Matching rows are selected and scrolled",
                'into view, but nothing is hidden, so users keep the surrounding rows for context.',
                'Matching works like `StoreFilterField`, against the visible columns (and any',
                '`groupBy` field) unless `includeFields` or `excludeFields` say otherwise.',
                '',
                'The field shows a match count with previous and next buttons. Enter and the',
                'down arrow step forward, and Shift+Enter and the up arrow step back.'
            ],
            links: [
                {
                    url: '$TB/client-app/src/desktop/tabs/grids/GridFindFieldPanel.ts',
                    notes: 'This example.'
                },
                {url: '$HR/desktop/cmp/grid/find/GridFindField.ts', notes: 'Hoist component.'}
            ],
            options: wrapperOptionGroup({
                label: 'Playground only - props',
                icon: Icon.experiment(),
                intent: 'primary',
                items: [
                    wrapperOption({
                        label: 'Match mode',
                        propName: 'GridFindFieldProps.matchMode',
                        control: select({
                            bind: 'matchMode',
                            enableFilter: false,
                            width: 130,
                            options: MATCH_MODE_OPTIONS
                        })
                    }),
                    wrapperOption({
                        label: 'Query buffer',
                        propName: 'GridFindFieldProps.queryBuffer',
                        info: 'Delay in ms before searching. 0 searches on every keystroke.',
                        control: select({
                            bind: 'queryBuffer',
                            enableFilter: false,
                            width: 130,
                            options: [0, 200, 500, 1000]
                        })
                    })
                ]
            }),
            item: demoPanel({
                items: [
                    demoSection({
                        title: 'Playground',
                        intent: 'primary',
                        item: demoPlayground({
                            showValue: false,
                            caption: 'Try "boston", then press Enter to step through matches.',
                            config: fmtDemoConfig<GridFindFieldProps>('gridFindField', {
                                gridModel: raw('gridModel'),
                                matchMode:
                                    model.matchMode === 'startWord' ? undefined : model.matchMode,
                                queryBuffer:
                                    model.queryBuffer === 200 ? undefined : model.queryBuffer
                            }),
                            item: gridFindField({
                                gridModel: model.gridModel,
                                matchMode: model.matchMode,
                                queryBuffer: model.queryBuffer,
                                width: '100%'
                            })
                        })
                    }),
                    demoSection({
                        title: 'Searched Grid',
                        note: 'Every field on this page searches this grid.',
                        item: tradesGridFrame({
                            gridModel: model.gridModel,
                            label: 'gridModel: gridModel',
                            info: 'Matches are selected - the row count stays the same.',
                            mask: [model.loadObserver]
                        })
                    }),
                    demoSection({
                        title: 'Variants',
                        item: demoRow({
                            label: 'Company names only',
                            info: "includeFields: ['company'] - a city name finds nothing here.",
                            item: gridFindField({
                                gridModel: model.gridModel,
                                includeFields: ['company'],
                                width: 260
                            })
                        })
                    }),
                    demoSection({
                        title: 'In a Toolbar',
                        items: [
                            demoToolbar({items: toolbarItems(model.gridModel)}),
                            demoToolbar({compact: true, items: toolbarItems(model.gridModel)})
                        ]
                    })
                ]
            })
        });
    }
});

function toolbarItems(gridModel: GridModel): ReactNode[] {
    return [
        gridFindField({gridModel}),
        toolbarSep(),
        button({icon: Icon.refresh(), text: 'Refresh'}),
        filler(),
        button({icon: Icon.download(), text: 'Export', outlined: true})
    ];
}

class GridFindFieldPanelModel extends HoistModel {
    @managed gridModel: GridModel = createTradesGridModel();

    @bindable accessor matchMode: FilterMatchMode = 'startWord';
    @bindable accessor queryBuffer = 200;

    override async doLoadAsync(loadSpec: LoadSpec) {
        await loadTradesAsync(this.gridModel);
    }
}
