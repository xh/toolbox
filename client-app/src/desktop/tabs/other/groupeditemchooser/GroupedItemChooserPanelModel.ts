import {ChartModel} from '@xh/hoist/cmp/chart';
import {HoistModel, managed, XH} from '@xh/hoist/core';
import {Icon} from '@xh/hoist/icon';
import {bindable, makeObservable, observable, runInAction} from '@xh/hoist/mobx';
import {
    ChooserNode,
    EntryInput,
    GroupedItemChooserModel,
    GroupedItemChooserValue
} from '../../../cmp/groupeditemchooser';
import {
    benchmarkKind,
    benchmarkRef,
    companyKind,
    companyRef,
    sampleAnchor,
    sampleProvidedGroups,
    sampleTransforms
} from './SampleData';

/**
 * Demo host for {@link GroupedItemChooser}. Owns the chooser model (rebuilt when dev-time config
 * toggles change, preserving current contents) and an example chart consumer of the emitted
 * `value` - the chart is deliberately outside the component, and owns the flatten of grouped
 * items into plotted series.
 */
export class GroupedItemChooserPanelModel extends HoistModel {
    @bindable enableGrouping = true;
    @bindable enableReordering = true;
    @bindable supportTransforms = true;
    @bindable displayMode: 'inline' | 'popover' = 'inline';

    @managed
    @observable.ref
    chooserModel: GroupedItemChooserModel;

    @managed
    chartModel: ChartModel = this.createChartModel();

    constructor() {
        super();
        makeObservable(this);

        this.chooserModel = this.createChooserModel(this.createInitialInputs());

        this.addReaction(
            {
                track: () => [
                    this.enableGrouping,
                    this.enableReordering,
                    this.supportTransforms,
                    this.displayMode
                ],
                run: () => this.rebuildChooserModel()
            },
            {
                track: () => this.chooserModel.value,
                run: value => this.updateChart(value),
                fireImmediately: true
            }
        );
    }

    //------------------------------------------------------------------------------------------
    // Chooser model lifecycle
    //------------------------------------------------------------------------------------------
    private createChooserModel(initialValue: EntryInput[]): GroupedItemChooserModel {
        return new GroupedItemChooserModel({
            kinds: [companyKind, benchmarkKind],
            providedGroups: sampleProvidedGroups,
            initialValue,
            anchorItem: sampleAnchor,
            enableGrouping: this.enableGrouping,
            enableReordering: this.enableReordering,
            transforms: this.supportTransforms ? sampleTransforms : [],
            defaultTransform: this.supportTransforms ? 'avg' : null,
            displayMode: this.displayMode,
            getIcon: node => this.getSampleIcon(node)
        });
    }

    /** Rebuild the chooser model on config change, carrying current contents forward. */
    private rebuildChooserModel() {
        const inputs = this.entriesToInputs();
        XH.safeDestroy(this.chooserModel);
        runInAction(() => (this.chooserModel = this.createChooserModel(inputs)));
    }

    private entriesToInputs(): EntryInput[] {
        return this.chooserModel.entries.map(e =>
            e.type === 'item'
                ? {type: 'item', item: e.item}
                : {
                      type: 'group',
                      id: e.id,
                      label: e.label,
                      source: e.source,
                      transformKey: e.transformKey,
                      members: e.members,
                      expanded: e.expanded
                  }
        );
    }

    private createInitialInputs(): EntryInput[] {
        const analystPeers = sampleProvidedGroups[0];
        return [
            {
                type: 'group',
                id: analystPeers.id,
                label: analystPeers.label,
                source: 'provided',
                transformKey: analystPeers.transformKey,
                members: analystPeers.members,
                expanded: true
            },
            {type: 'item', item: companyRef('SHEL')},
            {type: 'item', item: companyRef('XOM')},
            {type: 'item', item: benchmarkRef('SPX')}
        ];
    }

    /**
     * Per-node icons for the sample domain: groups get a users glyph, members render as compact
     * dot/line marks per kind, and top-level items fall back to their kind's base icon.
     */
    private getSampleIcon(node: ChooserNode) {
        if (node.nodeType === 'group') return Icon.users();
        if (node.level === 'member') {
            return node.kind === 'benchmark' ? Icon.chartLine() : Icon.circle({prefix: 'fas'});
        }
        return undefined;
    }

    //------------------------------------------------------------------------------------------
    // Example consumer - flatten `value` into plotted series. The consumer owns this logic,
    // including the choice not to dedupe items recurring across multiple no-transform groups.
    //------------------------------------------------------------------------------------------
    private updateChart(value: GroupedItemChooserValue) {
        const {chooserModel} = this,
            series = [];

        value.forEach(entry => {
            if (entry.type === 'item') {
                series.push(
                    this.seriesFor(entry.item.label, entry.color, entry.kind === 'benchmark')
                );
            } else if (entry.transformKey != null && chooserModel.transformsEnabled) {
                series.push(this.seriesFor(entry.label, entry.color, false));
            } else {
                entry.members.forEach(m => {
                    series.push(this.seriesFor(m.item.label, m.color, m.kind === 'benchmark'));
                });
            }
        });

        this.chartModel.setSeries(series);
    }

    /** Deterministic schematic random walk, indexed to 100 and seeded by series name. */
    private seriesFor(name: string, color: string, dashed: boolean) {
        let seed = 0;
        for (let i = 0; i < name.length; i++) seed = (seed * 31 + name.charCodeAt(i)) % 9973;
        const rnd = () => {
            seed = (seed * 1103515245 + 12345) & 0x7fffffff;
            return seed / 0x7fffffff;
        };

        const data = [];
        let v = 0;
        for (let i = 0; i < 14; i++) {
            v += (rnd() - 0.45) * 2;
            data.push([i, Math.round((100 + v * 2) * 10) / 10]);
        }

        return {
            name,
            color,
            data,
            dashStyle: dashed ? 'Dash' : 'Solid'
        };
    }

    private createChartModel(): ChartModel {
        return new ChartModel({
            highchartsConfig: {
                chart: {type: 'line', animation: false},
                title: {text: null},
                exporting: {enabled: false},
                legend: {enabled: true},
                tooltip: {shared: true},
                plotOptions: {
                    series: {animation: false, marker: {enabled: false}}
                },
                xAxis: {visible: false},
                yAxis: {title: {text: 'Indexed TSR (schematic)'}}
            }
        });
    }
}
