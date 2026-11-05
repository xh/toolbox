import {cubeGrid} from '@xh/hoist/cmp/cubegrid';
import {filler, fragment, span} from '@xh/hoist/cmp/layout';
import {creates, hoistCmp} from '@xh/hoist/core';
import {button, colChooserButton} from '@xh/hoist/desktop/cmp/button';
import {filterChooser} from '@xh/hoist/desktop/cmp/filter';
import {numberInput, select, switchInput, textInput} from '@xh/hoist/desktop/cmp/input';
import {panel} from '@xh/hoist/desktop/cmp/panel';
import {toolbar, toolbarSep} from '@xh/hoist/desktop/cmp/toolbar';
import {Icon} from '@xh/hoist/icon';
import {
    CubeGridTestModel,
    EXPAND_LEVEL_OPTIONS,
    FILTER_OPTIONS,
    SORT_OPTIONS,
    SUMMARY_H_OPTIONS,
    SUMMARY_V_OPTIONS
} from './CubeGridTestModel';

/**
 * A live CubeGrid with its config surface on five toolbars: the query shape on top, its options
 * next, a filter chooser on the view, the presentation below them, and the data on the bottom.
 * The split is the real one - query config lives on the Query, everything else on CubeGridModel.
 */
export const CubeGridTestPanel = hoistCmp({
    displayName: 'CubeGridTestPanel',
    model: creates(CubeGridTestModel),

    render({model}) {
        return panel({
            tbar: fragment(queryBar(), queryOptionsBar(), filterBar(), presentationBar()),
            bbar: dataBar(),
            mask: model.rebuilding,
            item: model.cubeGridModel
                ? cubeGrid({model: model.cubeGridModel, testId: 'cube-grid'})
                : null
        });
    }
});

const queryBar = hoistCmp.factory<CubeGridTestModel>(() =>
    toolbar(
        span('Group'),
        select({
            bind: 'groupBy',
            options: CubeGridTestModel.GROUP_DIMS,
            enableMulti: true,
            enableClear: false,
            width: 300
        }),
        span('Pivot'),
        select({
            bind: 'pivotBy',
            options: CubeGridTestModel.PIVOT_DIMS,
            enableMulti: true,
            enableClear: false,
            width: 280
        }),
        span('Values'),
        select({
            bind: 'valueFields',
            options: CubeGridTestModel.VALUE_FIELDS,
            enableMulti: true,
            enableClear: false,
            width: 280
        })
    )
);

const queryOptionsBar = hoistCmp.factory<CubeGridTestModel>(() =>
    toolbar(
        switchInput({bind: 'includeRoot', label: 'Root'}),
        switchInput({bind: 'includeLeaves', label: 'Leaves'}),
        switchInput({bind: 'omitRedundantNodes', label: 'Omit redundant'}),
        toolbarSep(),
        switchInput({bind: 'excludeEmptyPivotValues', label: 'Drop empties'}),
        span('Empty label'),
        textInput({bind: 'emptyPathLabel', width: 80}),
        span('Max paths'),
        numberInput({bind: 'maxPivotPaths', width: 70, placeholder: 'none', min: 1})
    )
);

const filterBar = hoistCmp.factory<CubeGridTestModel>(({model}) =>
    toolbar({
        omit: !model.filterChooserModel,
        item: filterChooser({model: model.filterChooserModel, flex: 1, enableClear: true})
    })
);

const presentationBar = hoistCmp.factory<CubeGridTestModel>(({model}) => {
    const {cubeGridModel} = model;
    return toolbar(
        span('Pivot summaries'),
        select({
            bind: 'showPivotSummaries',
            options: SUMMARY_H_OPTIONS,
            enableFilter: false,
            enableClear: false,
            width: 150
        }),
        span('Summary row'),
        select({
            bind: 'showSummary',
            options: SUMMARY_V_OPTIONS,
            enableFilter: false,
            enableClear: false,
            width: 100
        }),
        toolbarSep(),
        span('Filters'),
        select({
            bind: 'columnFilters',
            options: FILTER_OPTIONS,
            enableFilter: false,
            enableClear: false,
            width: 90
        }),
        button({
            icon: Icon.filter(),
            title: 'filterModel.openDialog()',
            omit: !cubeGridModel?.gridModel.filterModel,
            onClick: () => cubeGridModel.gridModel.filterModel.openDialog()
        }),
        toolbarSep(),
        switchInput({bind: 'pivotGroupsCollapsible', label: 'Collapsible'}),
        toolbarSep(),
        span('Expand'),
        select({
            bind: 'pivotExpandLevel',
            options: EXPAND_LEVEL_OPTIONS,
            enableFilter: false,
            enableClear: false,
            width: 160
        }),
        button({
            icon: Icon.expand(),
            title: 'expandAllPivotGroups()',
            onClick: () => cubeGridModel?.expandAllPivotGroups()
        }),
        button({
            icon: Icon.collapse(),
            title: 'collapseAllPivotGroups()',
            onClick: () => cubeGridModel?.collapseAllPivotGroups()
        }),
        toolbarSep(),
        span('Sort L0'),
        select({
            bind: 'sortLevel0',
            options: SORT_OPTIONS,
            enableFilter: false,
            enableClear: false,
            width: 115
        }),
        span('L1'),
        select({
            bind: 'sortLevel1',
            options: SORT_OPTIONS,
            enableFilter: false,
            enableClear: false,
            width: 115
        }),
        filler(),
        colChooserButton({gridModel: cubeGridModel, omit: !cubeGridModel})
    );
});

const dataBar = hoistCmp.factory<CubeGridTestModel>(({model}) =>
    toolbar(
        span('Leaves'),
        select({
            bind: 'leafCount',
            options: [500, 5000, 35000],
            enableFilter: false,
            enableClear: false,
            width: 100
        }),
        // Fixed at Store construction, so toggling rebuilds the Cube and everything below it.
        switchInput({bind: 'patchRecordSets', label: 'Patch'}),
        toolbarSep(),
        button({
            icon: Icon.refresh(),
            text: 'Tick',
            title: 'Perturb 2% of measures - no dimension moves, so columns must hold.',
            onClick: () => model.tickAsync()
        }),
        button({
            icon: Icon.add(),
            text: 'New pivot value',
            title: 'Structural - the new value must mint its own cell fields and columns.',
            onClick: () => model.addPivotValueAsync()
        }),
        button({
            icon: Icon.questionCircle(),
            text: 'Blank values',
            title: 'Null and blank pivot values form their own labelled path segment.',
            onClick: () => model.blankPivotValuesAsync()
        }),
        filler(),
        span({item: model.status, style: {opacity: 0.8}})
    )
);
