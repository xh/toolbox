import {cubeGrid} from '@xh/hoist/cmp/cubegrid';
import {filler, fragment, span} from '@xh/hoist/cmp/layout';
import {creates, hoistCmp} from '@xh/hoist/core';
import {button, colChooserButton} from '@xh/hoist/desktop/cmp/button';
import {numberInput, select, switchInput, textInput} from '@xh/hoist/desktop/cmp/input';
import {panel} from '@xh/hoist/desktop/cmp/panel';
import {toolbar, toolbarSep} from '@xh/hoist/desktop/cmp/toolbar';
import {Icon} from '@xh/hoist/icon';
import {
    CubeGridTestModel,
    EXPAND_LEVEL_OPTIONS,
    SORT_OPTIONS,
    SUMMARY_H_OPTIONS,
    SUMMARY_V_OPTIONS
} from './CubeGridTestModel';

/**
 * A live CubeGrid with its config surface on three toolbars: the query on top, the presentation
 * below it, and the data on the bottom. The split is the real one - query config lives on the
 * Query, everything else on CubeGridModel.
 */
export const CubeGridTestPanel = hoistCmp({
    displayName: 'CubeGridTestPanel',
    model: creates(CubeGridTestModel),

    render({model}) {
        return panel({
            tbar: fragment(queryBar(), presentationBar()),
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
        'Group',
        select({
            bind: 'groupBy',
            options: CubeGridTestModel.GROUP_DIMS,
            enableMulti: true,
            enableClear: false,
            width: 220
        }),
        'Pivot',
        select({
            bind: 'pivotBy',
            options: CubeGridTestModel.PIVOT_DIMS,
            enableMulti: true,
            enableClear: false,
            width: 250
        }),
        'Values',
        select({
            bind: 'valueFields',
            options: CubeGridTestModel.VALUE_FIELDS,
            enableMulti: true,
            enableClear: false,
            width: 230
        }),
        toolbarSep(),
        switchInput({bind: 'includeRoot', label: 'Root'}),
        switchInput({bind: 'includeLeaves', label: 'Leaves'}),
        switchInput({bind: 'omitRedundantNodes', label: 'Omit redundant'}),
        toolbarSep(),
        switchInput({bind: 'excludeEmptyPivotValues', label: 'Drop empties'}),
        'Empty label',
        textInput({bind: 'emptyPathLabel', width: 80}),
        'Max',
        numberInput({bind: 'maxPivotPaths', width: 70, placeholder: 'none', min: 1})
    )
);

const presentationBar = hoistCmp.factory<CubeGridTestModel>(({model}) => {
    const {cubeGridModel} = model;
    return toolbar(
        'Pivot summaries',
        select({
            bind: 'showPivotSummaries',
            options: SUMMARY_H_OPTIONS,
            enableFilter: false,
            enableClear: false,
            width: 150
        }),
        'Summary row',
        select({
            bind: 'showSummary',
            options: SUMMARY_V_OPTIONS,
            enableFilter: false,
            enableClear: false,
            width: 100
        }),
        toolbarSep(),
        switchInput({bind: 'pivotGroupsCollapsible', label: 'Collapsible'}),
        toolbarSep(),
        'Expand',
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
        'Sort L0',
        select({
            bind: 'sortLevel0',
            options: SORT_OPTIONS,
            enableFilter: false,
            enableClear: false,
            width: 115
        }),
        'L1',
        select({
            bind: 'sortLevel1',
            options: SORT_OPTIONS,
            enableFilter: false,
            enableClear: false,
            width: 115
        }),
        toolbarSep(),
        // A fixed column per value field, bound to its bare name - the row total.
        switchInput({bind: 'fixedTotalColumns', label: 'Fixed totals'}),
        // `hideable: false` on every measure, so the chooser cannot drop pivot columns.
        switchInput({bind: 'lockValueColumns', label: 'Lock values'}),
        filler(),
        colChooserButton({gridModel: cubeGridModel, omit: !cubeGridModel})
    );
});

const dataBar = hoistCmp.factory<CubeGridTestModel>(({model}) =>
    toolbar(
        'Leaves',
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
