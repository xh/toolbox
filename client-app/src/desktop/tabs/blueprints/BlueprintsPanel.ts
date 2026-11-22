import {creates, hoistCmp, HoistModel, persist, XH} from '@xh/hoist/core';
import type {PersistOptions} from '@xh/hoist/core';
import {button} from '@xh/hoist/desktop/cmp/button';
import {buttonGroupInput} from '@xh/hoist/desktop/cmp/input';
import {panel} from '@xh/hoist/desktop/cmp/panel';
import {toolbarSep} from '@xh/hoist/desktop/cmp/toolbar';
import {bindable, observableRef, runInAction} from '@xh/hoist/mobx';
import {find} from 'lodash';
import {blueprintShellView} from '../../../blueprints/BlueprintShell';
import {BlueprintShellModel} from '../../../blueprints/BlueprintShellModel';
import {BLUEPRINT_TYPES, PORTFOLIO_TYPE} from '../../../blueprints/blueprintTypes';
import type {BlueprintTypeSpec} from '../../../blueprints/blueprintTypes';

/** A blueprint type's route under the tab, such as `weather` for `toolbox.weather`. */
export function typeRouteName(type: BlueprintTypeSpec): string {
    return type.name.split('.').pop();
}

/** The type of blueprint the tab shows, and its shell, rebuilt when the type changes. */
class BlueprintsTabModel extends HoistModel {
    override persistWith: PersistOptions = {localStorageKey: 'blueprintsDesigner'};

    @bindable @persist accessor typeName: string = PORTFOLIO_TYPE.name;
    @observableRef accessor shellModel: BlueprintShellModel = null;

    constructor() {
        super();
        const linked = linkedType();
        if (linked) this.typeName = linked.name;
        this.openType();
        this.addReaction(
            {track: () => this.typeName, run: () => this.openType()},
            {
                track: () => linkedType(),
                run: type => {
                    if (type && type.name !== this.typeName) this.typeName = type.name;
                }
            }
        );
    }

    override destroy() {
        XH.safeDestroy(this.shellModel);
        super.destroy();
    }

    // Build the type's shell on the page the previous one showed.
    private openType() {
        const type = find(BLUEPRINT_TYPES, {name: this.typeName}) ?? PORTFOLIO_TYPE,
            view = this.shellModel?.view ?? 'blueprint';
        XH.safeDestroy(this.shellModel);
        const shellModel = new BlueprintShellModel({
            type,
            route: `default.blueprints.${typeRouteName(type)}.blueprint`
        });
        if (linkedType()?.name !== type.name) {
            const page = view === 'blueprint' ? '' : `.${view}`;
            XH.navigate(`default.blueprints.${typeRouteName(type)}${page}`);
            shellModel.view = view;
        }
        runInAction(() => (this.shellModel = shellModel));
        shellModel.loadAsync();
    }
}

// The type whose routes the address bar is on, if any.
function linkedType(): BlueprintTypeSpec {
    const name = XH.routerState?.name;
    return BLUEPRINT_TYPES.find(it => name?.startsWith(`default.blueprints.${typeRouteName(it)}`));
}

/** The Blueprints tab: a type's library and open blueprint, its Data Catalog and its Registry. */
export const blueprintsPanel = hoistCmp.factory({
    displayName: 'BlueprintsPanel',
    model: creates(BlueprintsTabModel),

    render({model}) {
        const {shellModel} = model;
        return panel({
            mask: shellModel.loadObserver,
            children: blueprintShellView({
                model: shellModel,
                key: shellModel.xhId,
                leadingItems: [
                    buttonGroupInput({
                        bind: 'typeName',
                        model,
                        children: BLUEPRINT_TYPES.map(it =>
                            button({value: it.name, text: it.label})
                        )
                    }),
                    toolbarSep()
                ]
            })
        });
    }
});
