import {tabContainer} from '@xh/hoist/cmp/tab';
import {hoistCmp} from '@xh/hoist/core';
import {Icon} from '@xh/hoist/icon';
import {catalogPanel} from './catalog/CatalogPanel';
import {registryPanel} from './registry/RegistryPanel';

/** What blueprints are built from: the server's Data Catalog, and the registries in code. */
export const referencePanel = hoistCmp.factory({
    displayName: 'ReferencePanel',
    model: false,

    render() {
        return tabContainer({
            modelConfig: {
                tabs: [
                    {id: 'catalog', title: 'Catalog', icon: Icon.database(), content: catalogPanel},
                    {id: 'registry', title: 'Registry', icon: Icon.list(), content: registryPanel}
                ]
            }
        });
    }
});
