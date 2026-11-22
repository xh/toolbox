import type {TabConfig, TabSwitcherConfig} from '@xh/hoist/cmp/tab';
import {hoistCmp} from '@xh/hoist/core';
import type {HoistProps, HoistRoute} from '@xh/hoist/core';
import {panel} from '@xh/hoist/desktop/cmp/panel';
import {Icon} from '@xh/hoist/icon';
import {blueprintShellView} from '../../../blueprints/BlueprintShell';
import {BlueprintShellModel} from '../../../blueprints/BlueprintShellModel';
import {BLUEPRINT_TYPES} from '../../../blueprints/blueprintTypes';
import type {BlueprintTypeSpec} from '../../../blueprints/blueprintTypes';
import {blueprintsOverview} from './BlueprintsOverview';

const ROUTE = 'default.blueprints';

/** A blueprint type's route under the tab, such as `weather` for `toolbox.weather`. */
export function typeRouteName(type: BlueprintTypeSpec): string {
    return type.name.split('.').pop();
}

/**
 * The Blueprints tab: an overview, then each example type's Library, Data Catalog and Registry,
 * as groups of its left switcher.
 */
export function blueprintsTab(switcher: TabSwitcherConfig): TabConfig {
    const tabs: TabConfig[] = [
        {id: 'overview', title: 'Overview', group: 'overview', content: blueprintsOverview},
        ...BLUEPRINT_TYPES.flatMap((type): TabConfig[] => {
            const name = typeRouteName(type),
                page = (view: string) => () => examplePage({type, key: view});
            // Each page shows the type's one shell, so only one may be mounted at a time.
            return [
                {
                    id: name,
                    title: 'Blueprints',
                    group: name,
                    icon: Icon.layout(),
                    renderMode: 'unmountOnHide',
                    content: page('blueprint')
                },
                {
                    id: `${name}Catalog`,
                    title: 'Data Catalog',
                    group: name,
                    icon: Icon.database(),
                    renderMode: 'unmountOnHide',
                    content: page('catalog')
                },
                {
                    id: `${name}Registry`,
                    title: 'Registry',
                    group: name,
                    icon: Icon.list(),
                    renderMode: 'unmountOnHide',
                    content: page('registry')
                }
            ];
        })
    ];
    return {
        id: 'blueprints',
        title: 'Blueprints',
        icon: Icon.layout(),
        content: {
            switcher: {
                ...switcher,
                groups: [
                    {key: 'overview', title: 'Overview'},
                    ...BLUEPRINT_TYPES.map(it => ({
                        key: typeRouteName(it),
                        title: `${it.label} example`
                    }))
                ]
            },
            tabs
        }
    };
}

/**
 * The Blueprints tab's routes. Each type's Data Catalog and Registry are siblings of its Library,
 * whose child opens one blueprint, as old links do.
 */
export function blueprintsRoutes(): HoistRoute {
    return {
        name: 'blueprints',
        path: '/blueprints',
        children: [
            {name: 'overview', path: '/overview'},
            ...BLUEPRINT_TYPES.flatMap(type => {
                const name = typeRouteName(type);
                return [
                    {name: `${name}Catalog`, path: `/${name}/catalog`},
                    {name: `${name}Registry`, path: `/${name}/registry`},
                    {
                        name,
                        path: `/${name}`,
                        children: [{name: 'blueprint', path: '/:id?draft&version'}]
                    }
                ];
            })
        ]
    };
}

//------------------
// Implementation
//------------------
// Each example type's shell, made when first shown and kept, so its pages share one open blueprint.
const shells = new Map<string, BlueprintShellModel>();

function shellFor(type: BlueprintTypeSpec): BlueprintShellModel {
    let ret = shells.get(type.name);
    if (!ret) {
        const name = typeRouteName(type);
        ret = new BlueprintShellModel({
            type,
            route: `${ROUTE}.${name}.blueprint`,
            pageRoutes: {
                library: `${ROUTE}.${name}`,
                catalog: `${ROUTE}.${name}Catalog`,
                registry: `${ROUTE}.${name}Registry`
            }
        });
        shells.set(type.name, ret);
        ret.loadAsync();
    }
    return ret;
}

interface ExamplePageProps extends HoistProps {
    type: BlueprintTypeSpec;
}

const examplePage = hoistCmp.factory<ExamplePageProps>({
    displayName: 'BlueprintsExamplePage',
    model: false,

    render({type}) {
        const shell = shellFor(type);
        return panel({mask: shell.loadObserver, children: blueprintShellView({model: shell})});
    }
});
