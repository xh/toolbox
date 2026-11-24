import {hframe} from '@xh/hoist/cmp/layout';
import {creates, hoistCmp} from '@xh/hoist/core';
import {CatalogModel} from './CatalogModel';
import {catalogDetail, catalogJsonPanel, catalogList} from './CatalogViews';

/**
 * The server's Data Catalog: its datasets and kinds and formats, the one selected, and its JSON.
 */
export const catalogPanel = hoistCmp.factory({
    displayName: 'CatalogPanel',
    model: creates(CatalogModel),

    render() {
        return hframe({
            className: 'tb-catalog',
            children: [catalogList(), catalogDetail(), catalogJsonPanel()]
        });
    }
});
