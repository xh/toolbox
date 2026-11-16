import {chart} from '@xh/hoist/cmp/chart';
import {box, div, filler, hbox, span, vbox} from '@xh/hoist/cmp/layout';
import type {PlainObject} from '@xh/hoist/core';
import {hoistCmp, uses} from '@xh/hoist/core';
import {button} from '@xh/hoist/desktop/cmp/button';
import {picker, switchInput} from '@xh/hoist/desktop/cmp/input';
import {panel} from '@xh/hoist/desktop/cmp/panel';
import {Icon} from '@xh/hoist/icon';
import {compact, isEmpty, maxBy} from 'lodash';
import {CubeTestModel} from './CubeTestModel';
import type {LoadTime} from './LoadTimesModel';

/** Live readout of the `diagnostics` published by each stage a Cube data change flows through. */
export const diagnosticsPanel = hoistCmp.factory({
    model: uses(CubeTestModel),

    render({model}) {
        const {cubeModel, view, gridModel, loadTimesModel} = model,
            cubeStore = cubeModel.cube.store,
            gridStore = gridModel.store,
            gridRows = gridModel.agApi?.getDisplayedRowCount(),
            asOf = loadTimesModel.total?.start ?? 0;

        return panel({
            title: 'Diagnostics',
            icon: Icon.gauge(),
            modelConfig: {
                side: 'right',
                defaultSize: 440,
                minSize: 360,
                defaultCollapsed: false
            },
            children: [
                div({
                    className: 'tb-cube-diagnostics',
                    children: [
                        timeSection('Total', loadTimesModel.total, asOf, 'tb-diag-section--total'),
                        timeSection('Fetch', loadTimesModel.fetch, asOf),
                        diagSection(
                            'Cube Store',
                            cubeStore.diagnostics,
                            ['load', 'update', 'filter'],
                            asOf,
                            count(cubeStore.count, 'recs')
                        ),
                        diagSection(
                            'View',
                            view.diagnostics,
                            ['query', 'load', 'update'],
                            asOf,
                            count(viewRows(view.diagnostics), 'rows')
                        ),
                        diagSection(
                            'Grid Store',
                            gridStore.diagnostics,
                            ['load', 'update', 'filter'],
                            asOf,
                            count(gridStore.count, 'recs')
                        ),
                        diagSection(
                            'Grid',
                            gridModel.diagnostics,
                            ['genTransaction', 'applyTransaction'],
                            asOf,
                            count(gridRows, 'visible rows')
                        ),
                        // Deferred ops - sort flushes land at idle, autosize after the syncing
                        // frame - both outside Total.
                        diagSection(
                            'Grid (Async)',
                            gridModel.diagnostics,
                            ['sortFlush', 'autosize'],
                            asOf
                        )
                    ]
                }),
                box({
                    className: 'tb-cube-diagnostics__memory',
                    height: 110,
                    omit: model.memoryChartModel.empty,
                    children: [
                        chart({model: model.memoryChartModel, flex: 1}),
                        span({
                            className: 'tb-cube-diagnostics__heap',
                            omit: model.heapMB == null,
                            children: `${model.heapMB} MB`
                        })
                    ]
                })
            ],
            bbar: [
                'Log:',
                picker({
                    bind: 'logStages',
                    flex: 1,
                    minWidth: 180,
                    // Values must match the keys on `CubeTestModel.diagnosticsByStage`.
                    options: [
                        {value: 'cubeStore', label: 'Cube Store'},
                        {value: 'view', label: 'View'},
                        {value: 'gridStore', label: 'Grid Store'},
                        {value: 'grid', label: 'Grid'}
                    ],
                    enableMulti: true,
                    enableClear: true,
                    enableSelectAll: true,
                    displayNoun: 'stage',
                    multiSelectButtonStyle: 'values',
                    multiSelectShowCount: true
                }),
                filler(),
                span({
                    title: model.gcAvailable
                        ? "Chart the GC'd JS heap after each load, at most once per 10s"
                        : 'Relaunch Chrome with --js-flags=--expose-gc --enable-precise-memory-info to enable',
                    children: switchInput({
                        bind: 'monitorMemory',
                        label: 'Memory',
                        disabled: !model.gcAvailable
                    })
                }),
                button({
                    title: 'Reset all counts and run times',
                    icon: Icon.reset({className: 'xh-red'}),
                    onClick: () => model.resetDiagnostics()
                })
            ]
        });
    }
});

function diagSection(
    title: string,
    diagnostics: PlainObject,
    kinds: string[],
    asOf: number,
    suffix: string = null
) {
    const ran = kinds.map(kind => ({kind, stats: diagnostics[kind]})).filter(it => it.stats?.last);
    return section(
        suffix ? `${title} (${suffix})` : title,
        ran.map(({kind, stats}) => opRow(kind, stats, isCurrent(stats.last.timestamp, asOf)))
    );
}

// Ops predating the last end-to-end action are left over from an earlier one - Total's own start
// is the cutoff, so it always reads as current.
function isCurrent(timestamp: number, asOf: number): boolean {
    return timestamp >= asOf;
}

// Rows the View last generated - read off its ops, vs. walking the published row tree.
function viewRows(diagnostics: PlainObject): number {
    const ops = ['query', 'load', 'update'].map(kind => diagnostics[kind]?.last).filter(Boolean);
    return isEmpty(ops) ? null : maxBy(ops, 'timestamp').total;
}

function count(value: number, unit: string): string {
    return value != null ? `${n(value)} ${unit}` : null;
}

function timeSection(title: string, loadTime: LoadTime, asOf: number, className: string = null) {
    return section(
        title,
        loadTime ? [tagRow(loadTime.tag, loadTime.took, isCurrent(loadTime.start, asOf))] : [],
        className
    );
}

function section(title: string, rows: any[], className: string = null) {
    const items = compact(rows);
    return vbox({
        className: `tb-diag-section${className ? ` ${className}` : ''}`,
        children: [
            div({className: 'tb-diag-section__title', children: title}),
            ...(isEmpty(items) ? [emptyRow('-')] : items)
        ]
    });
}

function tagRow(tag: string, took: number, isLatest: boolean) {
    return hbox({
        className: `tb-diag-row${isLatest ? ' tb-diag-row--latest' : ''} tb-diag-row__head`,
        children: [
            span({className: 'tb-diag-row__tag', children: tag}),
            filler(),
            span({className: 'tb-diag-row__elapsed', children: ms(took)})
        ]
    });
}

function emptyRow(text: string) {
    return div({className: 'tb-diag-row tb-diag-row--empty', children: text});
}

function opRow(kind: string, stats: PlainObject, isLatest: boolean) {
    const {last, count, elapsed} = stats;
    return vbox({
        className: `tb-diag-row${isLatest ? ' tb-diag-row--latest' : ''}`,
        children: [
            hbox({
                className: 'tb-diag-row__head',
                children: [
                    span({className: 'tb-diag-row__kind', children: kind}),
                    span({className: 'tb-diag-row__type', children: last.type}),
                    filler(),
                    span({className: 'tb-diag-row__elapsed', children: ms(last.elapsed)})
                ]
            }),
            hbox({
                className: 'tb-diag-row__detail',
                children: [
                    span(opDetail(last)),
                    filler(),
                    span(`n=${count} · avg ${ms(elapsed / count)}`)
                ]
            })
        ]
    });
}

// Work reported varies by stage - View generations, autosize, and record-level changes.
function opDetail(op: PlainObject): string {
    const parts =
        op.reused != null
            ? [`reused ${n(op.reused)}`, `rebuilt ${n(op.rebuilt)}`, `created ${n(op.created)}`]
            : op.columns != null
              ? [`cols ${n(op.columns)}`, `recs ${n(op.records)}`]
              : op.pending != null
                ? [`pending ${n(op.pending)}`, `of ${n(op.total)}`]
                : [`upd ${n(op.update)}`, `add ${n(op.add)}`, `rem ${n(op.remove)}`];

    return parts.join(' · ');
}

const n = (v: number) => v.toLocaleString();
const ms = (v: number) => `${v.toFixed(1)}ms`;
