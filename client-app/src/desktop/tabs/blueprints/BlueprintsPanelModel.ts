import type {BlueprintDataProvider, BlueprintIssue} from '@xh/hoist-chat-kit/blueprint';
import {BlueprintModel, DataCatalog} from '@xh/hoist-chat-kit/blueprint';
import {HoistModel, XH} from '@xh/hoist/core';
import type {LoadSpec, PlainObject} from '@xh/hoist/core';
import {action, bindable, computed, observable, observableRef, runInAction} from '@xh/hoist/mobx';
import {ServerDataProvider} from './ServerDataProvider';
import {createToolboxRegistry} from './toolboxRegistry';
import p1 from './scenarios/p1-one-grid.json';
import p2 from './scenarios/p2-linked-dashboard.json';
import p3 from './scenarios/p3-morning-report.json';
import p5 from './scenarios/p5-risk-report.json';

export const SCENARIOS: {value: string; label: string; blueprint: PlainObject}[] = [
    {value: 'p1', label: 'P1. One grid', blueprint: p1},
    {value: 'p2', label: 'P2. A linked dashboard', blueprint: p2},
    {value: 'p3', label: 'P3. A morning report', blueprint: p3},
    {value: 'p5', label: 'P5. A risk and stress report', blueprint: p5}
];

/**
 * The JSON harness: applies a pasted blueprint to a {@link BlueprintModel}, which keeps the last
 * valid blueprint rendered when a new one has errors. Builds the model once the server's Data
 * Catalog loads.
 */
export class BlueprintsPanelModel extends HoistModel {
    @bindable accessor scenario: string = SCENARIOS[0].value;
    @bindable accessor draft: string = '';

    /** Why the draft is not JSON, if it isn't. */
    @observable accessor parseError: string = null;

    /** Issues from the last apply. Errors mean the blueprint on screen is an older one. */
    @observableRef accessor applyIssues: BlueprintIssue[] = [];

    /** Null until the catalog loads. */
    @observableRef accessor blueprintModel: BlueprintModel = null;

    private createProvider: (catalog: DataCatalog) => BlueprintDataProvider;

    @computed
    get hasErrors(): boolean {
        return !!this.parseError || this.applyIssues.some(it => it.severity === 'error');
    }

    /** The rejected draft's issues after a failed apply, else the rendered blueprint's. */
    @computed
    get issues(): BlueprintIssue[] {
        return this.hasErrors ? this.applyIssues : (this.blueprintModel?.issues ?? []);
    }

    constructor(
        createProvider: (catalog: DataCatalog) => BlueprintDataProvider = () =>
            new ServerDataProvider()
    ) {
        super();
        this.createProvider = createProvider;
        this.addReaction({
            track: () => this.scenario,
            run: scenario => this.loadScenario(scenario)
        });
    }

    override async doLoadAsync(loadSpec: LoadSpec) {
        if (this.blueprintModel) return this.blueprintModel.loadAsync(loadSpec);

        const json = await XH.fetchJson({url: 'blueprints/catalog'}, {loadSpec});
        if (loadSpec.isStale) return;

        const catalog = new DataCatalog(json);
        runInAction(() => {
            this.blueprintModel = this.markManaged(
                new BlueprintModel({
                    catalog,
                    registry: createToolboxRegistry(),
                    dataProvider: this.createProvider(catalog),
                    // The harness is a design surface: widget changes are edits.
                    mode: 'design',
                    access: 'write'
                })
            );
        });
        this.loadScenario(this.scenario);
    }

    @action
    apply() {
        if (!this.blueprintModel) return;
        let bp: PlainObject;
        try {
            bp = JSON.parse(this.draft);
        } catch (e) {
            this.parseError = e.message;
            return;
        }
        this.parseError = null;
        this.applyIssues = this.blueprintModel.setBlueprint(bp);
    }

    //------------------
    // Implementation
    //------------------
    @action
    private loadScenario(scenario: string) {
        const {blueprint} = SCENARIOS.find(it => it.value === scenario);
        this.draft = JSON.stringify(blueprint, null, 4);
        this.apply();
    }
}
