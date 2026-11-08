import {cubeGrid} from '@xh/hoist/cmp/cubegrid';
import {box, div, filler, hbox, hframe, span, vbox} from '@xh/hoist/cmp/layout';
import {tabContainer} from '@xh/hoist/cmp/tab';
import {creates, hoistCmp} from '@xh/hoist/core';
import {button, colChooserButton} from '@xh/hoist/desktop/cmp/button';
import {filterChooser} from '@xh/hoist/desktop/cmp/filter';
import {numberInput, select, switchInput, textInput} from '@xh/hoist/desktop/cmp/input';
import {panel} from '@xh/hoist/desktop/cmp/panel';
import {toolbar, toolbarSep} from '@xh/hoist/desktop/cmp/toolbar';
import {Icon} from '@xh/hoist/icon';
import {startCase} from 'lodash';
import type {ReactElement, ReactNode} from 'react';
import {
    CubeGridTestModel,
    EXPAND_LEVEL_OPTIONS,
    FILTER_OPTIONS,
    SORT_OPTIONS,
    SUMMARY_COLUMN_OPTIONS,
    SUMMARY_ROW_OPTIONS
} from './CubeGridTestModel';

/**
 * A live CubeGrid with its config surface in a tabbed side panel. The tabs follow the real split:
 * Query config lives on the view's Query, Grid Core on the GridModel, Grid Pivot on `pivotModel`,
 * and Data drives the Cube. Each label's tooltip names the config key it sets.
 */
export const CubeGridTestPanel = hoistCmp({
    displayName: 'CubeGridTestPanel',
    model: creates(CubeGridTestModel),

    render({model}) {
        return hframe(
            panel({
                bbar: bottomBar(),
                mask: model.rebuilding,
                item: model.cubeGridModel
                    ? cubeGrid({model: model.cubeGridModel, testId: 'cube-grid'})
                    : null
            }),
            panel({
                title: 'Config',
                icon: Icon.gears(),
                compactHeader: true,
                modelConfig: {side: 'right', defaultSize: 320, resizable: true, collapsible: true},
                item: tabContainer({
                    modelConfig: {
                        tabs: [
                            {id: 'query', content: queryTab},
                            {id: 'gridCore', title: 'Grid Core', content: gridCoreTab},
                            {id: 'gridPivot', title: 'Grid Pivot', content: gridPivotTab},
                            {id: 'data', content: dataTab}
                        ]
                    }
                })
            })
        );
    }
});

const queryTab = hoistCmp.factory<CubeGridTestModel>(() =>
    tabBody(
        section('Shape'),
        field('Group by', 'query.dimensions', multiSelect('groupBy', CubeGridTestModel.GROUP_DIMS)),
        field(
            'Pivot by',
            'query.pivot.dimensions',
            multiSelect('pivotBy', CubeGridTestModel.PIVOT_DIMS)
        ),
        field(
            'Measures',
            'query.pivot.measures',
            multiSelect('measures', CubeGridTestModel.MEASURES)
        ),
        section('Rows'),
        field(
            'Root row',
            'query.includeRoot - shown as the Grid Core summary row',
            switchInput({bind: 'includeRoot'})
        ),
        field('Leaf rows', 'query.includeLeaves', switchInput({bind: 'includeLeaves'})),
        field(
            'Omit redundant',
            'query.omitRedundantNodes - a no-op on this data, where every group has many children',
            switchInput({bind: 'omitRedundantNodes'})
        ),
        section('Pivot paths'),
        field(
            'Exclude empty',
            'query.pivot.excludeEmptyPivotValues - add some with Data › Blank pivot values',
            switchInput({bind: 'excludeEmptyPivotValues'})
        ),
        field(
            'Max paths',
            'query.pivot.maxPivotPaths - blank for none',
            numberInput({bind: 'maxPivotPaths', width: 80, placeholder: 'none', min: 1})
        )
    )
);

const gridPivotTab = hoistCmp.factory<CubeGridTestModel>(({model}) => {
    const {cubeGridModel, pivotBy} = model;
    return tabBody(
        section('Dimension defaults'),
        field(
            'Summary column',
            'dimensionDefaults.showSummary',
            enumSelect('showPivotSummaries', SUMMARY_COLUMN_OPTIONS)
        ),
        field(
            'Collapsible',
            'dimensionDefaults.collapsible',
            switchInput({bind: 'pivotGroupsCollapsible'})
        ),
        field(
            'Collapsed label',
            'dimensionDefaults.showCollapsedLabel - n/a with measures outermost',
            switchInput({
                bind: 'pivotShowCollapsedLabel',
                disabled: !model.pivotGroupsCollapsible || model.pivotMeasuresOutermost
            })
        ),
        field(
            'Empty label',
            'dimensionDefaults.emptyLabel',
            textInput({bind: 'emptyLabel', flex: 1})
        ),
        section('Per dimension'),
        ...[0, 1].map(level =>
            field(
                `Sort ${startCase(pivotBy[level] ?? `level ${level}`)}`,
                `dimensions[${level}].sortBy`,
                enumSelect(`sortLevel${level}`, SORT_OPTIONS, !pivotBy[level])
            )
        ),
        section('Measures'),
        field(
            'Outermost',
            'measuresOutermost - measures above the pivot groups, not below',
            switchInput({bind: 'pivotMeasuresOutermost'})
        ),
        section('Sizing'),
        field(
            'Linked sizing',
            'linkedSizing - off sizes each pivot column on its own',
            switchInput({bind: 'linkedPivotSizing'})
        ),
        field(
            'Header fit max',
            'linkedSizing.headerFitMaxWidth - 0 or blank sizes for data alone',
            numberInput({
                bind: 'headerFitMaxWidth',
                width: 80,
                min: 0,
                disabled: !model.linkedPivotSizing
            })
        ),
        section('Expansion'),
        field(
            'Expand level',
            'expandLevel - pushed live via pivotModel.expandToLevel()',
            enumSelect('pivotExpandLevel', EXPAND_LEVEL_OPTIONS)
        ),
        hbox({
            marginTop: 4,
            items: [
                button({
                    icon: Icon.expand(),
                    text: 'Expand all',
                    title: 'pivotModel.expandAll()',
                    outlined: true,
                    onClick: () => cubeGridModel?.pivotModel.expandAll()
                }),
                box({width: 6}),
                button({
                    icon: Icon.collapse(),
                    text: 'Collapse all',
                    title: 'pivotModel.collapseAll()',
                    outlined: true,
                    onClick: () => cubeGridModel?.pivotModel.collapseAll()
                })
            ]
        })
    );
});

const gridCoreTab = hoistCmp.factory<CubeGridTestModel>(({model}) => {
    const {cubeGridModel} = model;
    return tabBody(
        section('Rows'),
        field(
            'Summary row',
            'gridConfig.showSummary - the root row, so needs Root row on the Query tab',
            enumSelect('showSummary', SUMMARY_ROW_OPTIONS, !model.includeRoot)
        ),
        section('Columns'),
        field(
            'Column filters',
            'gridConfig.filterModel - bound to the view or the store. Change rebuilds.',
            enumSelect('columnFilters', FILTER_OPTIONS)
        ),
        hbox({
            marginTop: 4,
            items: [
                button({
                    icon: Icon.filter(),
                    text: 'Filter dialog',
                    title: 'filterModel.openDialog()',
                    outlined: true,
                    disabled: !cubeGridModel?.gridModel.filterModel,
                    onClick: () => cubeGridModel.gridModel.filterModel.openDialog()
                }),
                box({width: 6}),
                colChooserButton({
                    gridModel: cubeGridModel?.gridModel,
                    text: 'Choose columns',
                    title: 'Fixed columns only - pivot columns are not chooser-managed.',
                    outlined: true,
                    disabled: !cubeGridModel
                })
            ]
        })
    );
});

const dataTab = hoistCmp.factory<CubeGridTestModel>(({model}) =>
    tabBody(
        section('Cube'),
        field(
            'Leaf count',
            'Generated fact rows. Change rebuilds.',
            enumSelect('leafCount', [500, 5000, 35000])
        ),
        field(
            'Patch records',
            'store.experimental.maxPatchRatio. Fixed at Store construction, so a change rebuilds.',
            switchInput({bind: 'patchRecordSets'})
        ),
        section('Updates'),
        updateButton({
            icon: Icon.refresh(),
            text: 'Tick measures',
            title: 'Perturb 2% of measures - no dimension moves, so columns must hold.',
            onClick: () => model.tickAsync()
        }),
        updateButton({
            icon: Icon.add(),
            text: 'Add pivot value',
            title: 'Structural - the new value must mint its own cell fields and columns.',
            onClick: () => model.addPivotValueAsync()
        }),
        updateButton({
            icon: Icon.questionCircle(),
            text: 'Blank pivot values',
            title: 'Null and blank pivot values form their own labelled path segment.',
            onClick: () => model.blankPivotValuesAsync()
        }),
        updateButton({
            icon: Icon.arrowsLeftRight(),
            text: 'Lengthen pivot values',
            title: 'Long innermost values, to see leaf labels fitted and truncated.',
            onClick: () => model.lengthenPivotValuesAsync()
        })
    )
);

const bottomBar = hoistCmp.factory<CubeGridTestModel>(({model}) => {
    const {filterChooserModel} = model;
    return toolbar(
        span({
            omit: !filterChooserModel,
            item: 'View filter',
            title: 'FilterChooserModel bound to the view'
        }),
        filterChooser({
            omit: !filterChooserModel,
            model: filterChooserModel,
            flex: 1,
            enableClear: true
        }),
        filler({omit: !!filterChooserModel}),
        toolbarSep(),
        span({item: model.status, style: {opacity: 0.8}})
    );
});

//------------------------
// Layout helpers
//------------------------
function tabBody(...items: ReactNode[]) {
    return vbox({className: 'xh-pad', flex: 1, overflowY: 'auto', items});
}

function section(title: string) {
    return div({
        className: 'xh-bold xh-text-color-muted xh-font-size-small',
        style: {margin: '12px 0 6px', textTransform: 'uppercase'},
        item: title
    });
}

/** A labelled row. The tooltip names the config key the input sets. */
function field(label: string, configKey: string, input: ReactElement) {
    return hbox({
        alignItems: 'center',
        minHeight: 28,
        marginBottom: 4,
        items: [box({width: 115, flex: 'none', title: configKey, item: label}), input]
    });
}

function multiSelect(bind: string, options: string[]) {
    return select({bind, options, enableMulti: true, enableClear: false, flex: 1});
}

function enumSelect(bind: string, options: any[], disabled = false) {
    return select({bind, options, enableFilter: false, enableClear: false, flex: 1, disabled});
}

function updateButton(props) {
    return button({...props, outlined: true, style: {marginBottom: 6}});
}
