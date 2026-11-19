import type {BlueprintDataProvider, BlueprintIssue} from '@xh/hoist-chat-kit/blueprint';
import {BlueprintModel, DataCatalog} from '@xh/hoist-chat-kit/blueprint';
import {HoistModel, managed} from '@xh/hoist/core';
import type {PlainObject} from '@xh/hoist/core';
import {action, bindable, computed, observable, observableRef} from '@xh/hoist/mobx';
import portfolioCatalog from './catalog/portfolio.json';
import {ServerDataProvider} from './ServerDataProvider';
import {createToolboxRegistry} from './toolboxRegistry';
import p1 from './scenarios/p1-one-grid.json';
import p2 from './scenarios/p2-linked-dashboard.json';

export const SCENARIOS: {value: string; label: string; blueprint: PlainObject}[] = [
    {value: 'p1', label: 'P1. One grid', blueprint: p1},
    {value: 'p2', label: 'P2. A linked dashboard', blueprint: p2}
];

/**
 * The JSON harness: applies a pasted blueprint to a {@link BlueprintModel}, which keeps the last
 * valid blueprint rendered when a new one has errors.
 */
export class BlueprintsPanelModel extends HoistModel {
    @bindable accessor scenario: string = SCENARIOS[0].value;
    @bindable accessor draft: string = '';

    /** Why the draft is not JSON, if it isn't. */
    @observable accessor parseError: string = null;

    /** Issues from the last apply. Errors mean the blueprint on screen is an older one. */
    @observableRef accessor applyIssues: BlueprintIssue[] = [];

    @managed blueprintModel: BlueprintModel;

    @computed
    get hasErrors(): boolean {
        return !!this.parseError || this.applyIssues.some(it => it.severity === 'error');
    }

    /** The rejected draft's issues after a failed apply, else the rendered blueprint's. */
    @computed
    get issues(): BlueprintIssue[] {
        return this.hasErrors ? this.applyIssues : this.blueprintModel.issues;
    }

    constructor(dataProvider: BlueprintDataProvider = new ServerDataProvider()) {
        super();

        this.blueprintModel = new BlueprintModel({
            catalog: new DataCatalog(portfolioCatalog),
            registry: createToolboxRegistry(),
            dataProvider
        });

        this.addReaction({
            track: () => this.scenario,
            run: scenario => this.loadScenario(scenario),
            fireImmediately: true
        });
    }

    @action
    apply() {
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
