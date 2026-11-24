import type {Blueprint} from '@xh/hoist-chat-kit/blueprint';
import {BlueprintModel} from '@xh/hoist-chat-kit/blueprint';
import {blueprintView} from '@xh/hoist-chat-kit/desktop/cmp/blueprint';
import {placeholder} from '@xh/hoist/cmp/layout';
import {creates, hoistCmp, HoistModel, XH} from '@xh/hoist/core';
import type {LoadSpec} from '@xh/hoist/core';
import {panel} from '@xh/hoist/desktop/cmp/panel';
import {Icon} from '@xh/hoist/icon';
import {bindable, observableRef, runInAction} from '@xh/hoist/mobx';
import {PORTFOLIO_TYPE} from '../../../../blueprints/blueprintTypes';
import {fundInput} from '../../../../blueprints/FundInput';
import {ServerDataProvider} from '../../../../blueprints/ServerDataProvider';
import {wrapper, wrapperOption} from '../../../common/Wrapper';
import {portfolioCatalogAsync} from '../portfolioCatalog';

/** A blueprint whose `fund` only its host sets: no prompt, link or Architect edit can. */
export const HOSTING_BLUEPRINT: Blueprint = {
    variables: {
        asOf: {
            type: 'localDate',
            label: 'As of',
            setBy: 'prompt',
            default: {resolver: 'previousBusinessDay'}
        },
        fund: {type: 'toolbox.fund', label: 'Fund', setBy: 'host'}
    },
    sources: {
        positions: {dataset: 'positions', params: {asOf: {$var: 'asOf'}, fund: {$var: 'fund'}}}
    },
    root: 'page',
    elements: {
        page: {component: 'panel', tbar: [{id: 'asOfInput'}], children: [{id: 'posGrid'}]},
        asOfInput: {component: 'variableInput', config: {variable: 'asOf'}},
        posGrid: {
            component: 'cubeGrid',
            config: {
                source: 'positions',
                groupBy: ['sector', 'symbol'],
                columnState: ['mktVal', 'pnlDay']
            }
        }
    }
};

/** Hosts {@link HOSTING_BLUEPRINT}, and sets its fund from the page's own fund control. */
export class HostingPageModel extends HoistModel {
    /** The fund the page gives the blueprint. Null for all funds. */
    @bindable accessor fund: string = XH.getPref('blueprintsFund', null);
    @observableRef accessor blueprintModel: BlueprintModel = null;

    constructor() {
        super();
        this.addReaction({
            track: () => [this.fund, this.blueprintModel] as const,
            run: ([fund, blueprintModel]) => blueprintModel?.setHostVariable('fund', fund)
        });
    }

    override async doLoadAsync(loadSpec: LoadSpec) {
        if (this.blueprintModel) return;
        const catalog = await portfolioCatalogAsync();
        if (loadSpec.isStale) return;
        const blueprintModel = this.markManaged(
            new BlueprintModel({
                catalog,
                registry: PORTFOLIO_TYPE.createRegistry(),
                dataProvider: new ServerDataProvider(),
                mode: 'run',
                access: 'read'
            })
        );
        blueprintModel.setBlueprint(HOSTING_BLUEPRINT);
        runInAction(() => (this.blueprintModel = blueprintModel));
    }
}

export const hostingPage = hoistCmp.factory({
    displayName: 'BlueprintsHostingPage',
    model: creates(HostingPageModel),

    render({model}) {
        const {blueprintModel} = model;
        return wrapper({
            title: 'Hosting in an app',
            icon: Icon.book(),
            description: [
                'An app can host a blueprint inside its own screens, and keep some of its variables for itself. A variable with `setBy: "host"` takes its value only from app code, through `BlueprintModel.setHostVariable()`.',
                '',
                'No prompt shows it, and no link, action or Architect edit can set it. Below, this page owns the fund: pick one in the options, and the blueprint shows its positions.'
            ],
            options: wrapperOption({
                label: 'Fund',
                control: fundInput({
                    variable: blueprintModel?.getVariable('fund'),
                    value: model.fund,
                    onCommit: v => (model.fund = v as string)
                })
            }),
            children: panel({
                className: 'tb-blueprints-island',
                title: 'Example',
                icon: Icon.play(),
                compactHeader: true,
                width: '100%',
                height: '100%',
                mask: model.loadObserver,
                children: blueprintModel
                    ? blueprintView({model: blueprintModel})
                    : placeholder('Loading the example...')
            })
        });
    }
});
