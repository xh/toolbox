import {tabContainer} from '@xh/hoist/cmp/tab';
import {creates, hoistCmp} from '@xh/hoist/core';
import {CatalogModel} from './CatalogModel';

/** The server's Data Catalog: its datasets with their parameters and fields, kinds, formats, and JSON. */
export const catalogPanel = hoistCmp.factory({
    displayName: 'CatalogPanel',
    model: creates(CatalogModel),

    render({model}) {
        return tabContainer({model: model.tabContainerModel});
    }
});
