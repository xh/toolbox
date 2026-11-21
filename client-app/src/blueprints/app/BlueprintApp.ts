import {hframe} from '@xh/hoist/cmp/layout';
import {hoistCmp, managed, uses, XH} from '@xh/hoist/core';
import type {InitContext, LoadSpec} from '@xh/hoist/core';
import {appBar} from '@xh/hoist/desktop/cmp/appbar';
import {sizingModeAppOption, themeAppOption} from '@xh/hoist/desktop/cmp/appOption';
import {panel} from '@xh/hoist/desktop/cmp/panel';
import type {ReactElement} from 'react';
import {BaseAppModel} from '../../BaseAppModel';
import '../../core/Toolbox.scss';
import {blueprintLibrary, blueprintWorkspace} from '../BlueprintShell';
import {BlueprintShellModel} from '../BlueprintShellModel';

/** The route of a blueprint app that opens one blueprint, by its id. */
export const BLUEPRINT_APP_ROUTE = 'default.blueprint';

export interface BlueprintAppConfig {
    /** Names the app's local state, such as its selection and conversations. */
    storageKey: string;
    /** The datasets of the server's Data Catalog the app offers. */
    datasets: string[];
    icon: ReactElement;
}

/**
 * An app built on the blueprint shell: its library beside the Architect and the open blueprint.
 * Each app subclasses it with its config, and links to a blueprint at `/<app>/<id>`.
 */
export abstract class BlueprintAppModel extends BaseAppModel {
    abstract readonly appConfig: BlueprintAppConfig;

    @managed shellModel: BlueprintShellModel;

    override getRoutes() {
        return [
            {
                name: 'default',
                path: `/${XH.clientAppCode}`,
                children: [{name: 'blueprint', path: '/:id?draft&version'}]
            }
        ];
    }

    override async initAsync(ctx: InitContext) {
        await super.initAsync(ctx);
        const {storageKey, datasets} = this.appConfig;
        this.shellModel = new BlueprintShellModel({
            storageKey,
            datasets,
            route: BLUEPRINT_APP_ROUTE
        });
        await this.loadAsync(ctx);
    }

    override async doLoadAsync(loadSpec: LoadSpec) {
        return this.shellModel?.loadAsync(loadSpec);
    }

    override getAppOptions() {
        return [themeAppOption(), sizingModeAppOption()];
    }
}

export const BlueprintAppComponent = hoistCmp({
    displayName: 'BlueprintApp',
    model: uses(BlueprintAppModel),

    render({model}) {
        const {shellModel, appConfig: config} = model;
        return panel({
            tbar: appBar({
                icon: config.icon,
                appMenuButtonProps: {hideLogoutItem: false}
            }),
            mask: 'onLoad',
            item: hframe(
                panel({
                    title: 'Blueprints',
                    compactHeader: true,
                    className: 'tb-blueprint-app__library',
                    modelConfig: {
                        side: 'left',
                        defaultSize: 280,
                        minSize: 200,
                        persistWith: {localStorageKey: `${config.storageKey}.library`}
                    },
                    item: blueprintLibrary({model: shellModel})
                }),
                blueprintWorkspace({model: shellModel})
            )
        });
    }
});
