import type {GridModel} from '@xh/hoist/cmp/grid';
import {filler} from '@xh/hoist/cmp/layout';
import type {LoadSpec} from '@xh/hoist/core';
import {creates, hoistCmp, HoistModel, managed} from '@xh/hoist/core';
import type {FilterMatchMode} from '@xh/hoist/data';
import {button} from '@xh/hoist/desktop/cmp/button';
import type {GridFindFieldMode, GridFindFieldProps} from '@xh/hoist/desktop/cmp/grid';
import {gridFindField} from '@xh/hoist/desktop/cmp/grid';
import {select, switchInput} from '@xh/hoist/desktop/cmp/input';
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
                'down arrow step forward, and Shift+Enter and the up arrow step back.',
                '',
                "With `mode: 'cells'`, it finds matching column headers and cells instead, and",
                "moves between them like Excel's Find, without changing row selection."
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
                children: [
                    wrapperOption({
                        label: 'Mode',
                        propName: 'GridFindFieldProps.mode',
                        info:
                            "'rows' selects matching rows. 'cells' moves between matching " +
                            'headers and cells, like Excel Find, and leaves selection alone.',
                        control: select({
                            bind: 'mode',
                            enableFilter: false,
                            width: 130,
                            options: ['rows', 'cells']
                        })
                    }),
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
                    }),
                    wrapperOption({
                        label: 'Ctrl+F hotkey',
                        propName: 'GridFindFieldProps.enableHotkey',
                        info: "Ctrl+F (Cmd+F) focuses the field in place of the browser's find.",
                        control: switchInput({bind: 'enableHotkey'})
                    })
                ]
            }),
            children: demoPanel({
                children: [
                    demoSection({
                        title: 'Playground',
                        intent: 'primary',
                        children: demoPlayground({
                            showValue: false,
                            caption:
                                model.mode === 'cells'
                                    ? 'Try "boston" or "volume", then press Enter to step through ' +
                                      'matches. Click a cell to step on from there.'
                                    : 'Try "boston", then press Enter to step through matches.',
                            config: fmtDemoConfig<GridFindFieldProps>('gridFindField', {
                                gridModel: raw('gridModel'),
                                mode: model.mode === 'rows' ? undefined : model.mode,
                                matchMode:
                                    model.matchMode === defaultMatchMode(model.mode)
                                        ? undefined
                                        : model.matchMode,
                                queryBuffer:
                                    model.queryBuffer === 200 ? undefined : model.queryBuffer,
                                enableHotkey: model.enableHotkey || undefined
                            }),
                            // The field reads `mode` once, when it mounts - remount it on change.
                            children: gridFindField({
                                key: model.mode,
                                gridModel: model.gridModel,
                                mode: model.mode,
                                matchMode: model.matchMode,
                                queryBuffer: model.queryBuffer,
                                enableHotkey: model.enableHotkey,
                                width: '100%'
                            })
                        })
                    }),
                    demoSection({
                        title: 'Searched Grid',
                        note: 'Every field on this page searches this grid.',
                        children: tradesGridFrame({
                            gridModel: model.gridModel,
                            label: 'gridModel: gridModel',
                            info:
                                model.mode === 'cells'
                                    ? 'Matching cells are tinted and the active match is ' +
                                      'outlined - selection is not changed.'
                                    : 'Matches are selected - the row count stays the same.',
                            mask: [model.loadObserver]
                        })
                    }),
                    demoSection({
                        title: 'Variants',
                        children: demoRow({
                            label: 'Company names only',
                            info: "includeFields: ['company'] - a city name finds nothing here.",
                            children: gridFindField({
                                gridModel: model.gridModel,
                                includeFields: ['company'],
                                width: 260
                            })
                        })
                    }),
                    demoSection({
                        title: 'In a Toolbar',
                        children: [
                            demoToolbar({children: toolbarItems(model.gridModel)}),
                            demoToolbar({compact: true, children: toolbarItems(model.gridModel)})
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

    @bindable accessor mode: GridFindFieldMode = 'rows';
    @bindable accessor matchMode: FilterMatchMode = 'startWord';
    @bindable accessor queryBuffer = 200;
    @bindable accessor enableHotkey = false;

    constructor() {
        super();
        // Each mode has its own default match mode.
        this.addReaction({
            track: () => this.mode,
            run: mode => (this.matchMode = defaultMatchMode(mode))
        });
    }

    override async doLoadAsync(loadSpec: LoadSpec) {
        await loadTradesAsync(this.gridModel);
    }
}

function defaultMatchMode(mode: GridFindFieldMode): FilterMatchMode {
    return mode === 'cells' ? 'any' : 'startWord';
}
