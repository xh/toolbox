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
import {
    createPositionsTreeGridModel,
    loadPositionsAsync,
    positionsTreeGridFrame
} from './helpers/PositionsTreeGrid';

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
                "With `mode: 'cells'`, it finds matching cells instead and moves between them",
                "like Excel's Find, selecting the row of each match. Set `includeHeaders` to",
                'find column headers too.'
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
                            'cells, like Excel Find, and selects the row of each.',
                        control: select({
                            bind: 'mode',
                            enableFilter: false,
                            width: 130,
                            options: ['rows', 'cells']
                        })
                    }),
                    wrapperOption({
                        label: 'Headers',
                        propName: 'GridFindFieldProps.includeHeaders',
                        info: "Also find column headers. Mode 'cells' only.",
                        control: switchInput({
                            bind: 'includeHeaders',
                            disabled: model.mode !== 'cells'
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
                                    ? 'Try "energy", then press Enter to step through matches. ' +
                                      'Click a cell to step on from there. With headers on, ' +
                                      'try "p&l". A commission match expands the Costs group.'
                                    : 'Try "klecko", then press Enter to step through matches.',
                            config: fmtDemoConfig<GridFindFieldProps>('gridFindField', {
                                gridModel: raw('gridModel'),
                                mode: model.mode === 'rows' ? undefined : model.mode,
                                includeHeaders:
                                    (model.mode === 'cells' && model.includeHeaders) || undefined,
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
                                includeHeaders: model.includeHeaders,
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
                        children: positionsTreeGridFrame({
                            gridModel: model.gridModel,
                            label: 'gridModel: gridModel',
                            info:
                                'A tree grid that starts collapsed. Find expands it to show ' +
                                (model.mode === 'cells'
                                    ? 'the active match, which is outlined, and selects its row.'
                                    : 'each match, which is selected.'),
                            mask: [model.loadObserver]
                        })
                    }),
                    demoSection({
                        title: 'Variants',
                        children: demoRow({
                            label: 'Names only',
                            info: "includeFields: ['name'] - a P&L figure finds nothing here.",
                            children: gridFindField({
                                gridModel: model.gridModel,
                                includeFields: ['name'],
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
    @managed gridModel: GridModel = createPositionsTreeGridModel();

    @bindable accessor mode: GridFindFieldMode = 'rows';
    @bindable accessor includeHeaders = false;
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
        await loadPositionsAsync(this.gridModel);
    }
}

function defaultMatchMode(mode: GridFindFieldMode): FilterMatchMode {
    return mode === 'cells' ? 'any' : 'startWord';
}
