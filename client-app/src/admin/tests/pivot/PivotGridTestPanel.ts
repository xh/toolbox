import {pivotGrid} from '@xh/hoist/cmp/pivotgrid';
import {filler, span} from '@xh/hoist/cmp/layout';
import {creates, hoistCmp} from '@xh/hoist/core';
import {button} from '@xh/hoist/desktop/cmp/button';
import {select, switchInput} from '@xh/hoist/desktop/cmp/input';
import {panel} from '@xh/hoist/desktop/cmp/panel';
import {toolbar, toolbarSep} from '@xh/hoist/desktop/cmp/toolbar';
import {Icon} from '@xh/hoist/icon';
import {PivotGridTestModel, SUMMARY_H_OPTIONS, SUMMARY_V_OPTIONS} from './PivotGridTestModel';

/**
 * A live PivotGrid with its config surface on two toolbars: the query above, the presentation below.
 * The split is the real one - query config lives on the Query, everything else on PivotGridModel.
 */
export const PivotGridTestPanel = hoistCmp({
    displayName: 'PivotGridTestPanel',
    model: creates(PivotGridTestModel),

    render({model}) {
        return panel({
            tbar: queryBar(),
            bbar: displayBar(),
            mask: model.rebuilding,
            item: model.pivotGridModel
                ? pivotGrid({model: model.pivotGridModel, testId: 'pivot-grid'})
                : null
        });
    }
});

const queryBar = hoistCmp.factory<PivotGridTestModel>(() =>
    toolbar(
        'Group by',
        select({
            bind: 'groupBy',
            options: PivotGridTestModel.GROUP_DIMS,
            enableMulti: true,
            enableClear: false,
            width: 280
        }),
        'Pivot by',
        select({
            bind: 'pivotBy',
            options: PivotGridTestModel.PIVOT_DIMS,
            enableMulti: true,
            enableClear: false,
            width: 280
        }),
        'Values',
        select({
            bind: 'valueFields',
            options: PivotGridTestModel.VALUE_FIELDS,
            enableMulti: true,
            enableClear: false,
            width: 300
        }),
        toolbarSep(),
        switchInput({bind: 'includeRoot', label: 'Root'}),
        switchInput({bind: 'includeLeaves', label: 'Leaves'}),
        switchInput({bind: 'excludeEmptyPivotValues', label: 'Drop empties'}),
        // Fixed at Store construction, so toggling rebuilds the Cube and everything below it.
        switchInput({bind: 'patchRecordSets', label: 'Patch'})
    )
);

const displayBar = hoistCmp.factory<PivotGridTestModel>(({model}) => {
    const {pivotGridModel} = model;
    return toolbar(
        'Row summary',
        select({
            model: pivotGridModel,
            bind: 'rowSummary',
            options: SUMMARY_H_OPTIONS,
            enableFilter: false,
            enableClear: false,
            width: 100
        }),
        'Pivot summary',
        select({
            model: pivotGridModel,
            bind: 'pivotSummary',
            options: SUMMARY_H_OPTIONS,
            enableFilter: false,
            enableClear: false,
            width: 100
        }),
        'Value summary',
        select({
            model: pivotGridModel,
            bind: 'valueSummary',
            options: SUMMARY_V_OPTIONS,
            enableFilter: false,
            enableClear: false,
            width: 110
        }),
        toolbarSep(),
        'Sort',
        select({
            bind: 'pivotSort',
            options: [
                {value: null, label: 'View order'},
                {value: 'asc', label: 'Asc'},
                {value: 'desc', label: 'Desc'}
            ],
            enableFilter: false,
            enableClear: false,
            width: 120
        }),
        toolbarSep(),
        'Leaves',
        select({
            bind: 'leafCount',
            options: [500, 5000, 35000],
            enableFilter: false,
            enableClear: false,
            width: 100
        }),
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
    );
});
