import {hframe} from '@xh/hoist/cmp/layout';
import {creates, hoistCmp} from '@xh/hoist/core';
import {CatalogModel} from './CatalogModel';
import {catalogDetail, catalogJsonDialog, catalogList} from './CatalogViews';

/** The server's Data Catalog: its datasets, kinds and formats in one list, beside the one selected. */
export const catalogPanel = hoistCmp.factory({
    displayName: 'CatalogPanel',
    model: creates(CatalogModel),

    render() {
        return hframe({
            className: 'tb-catalog',
            children: [catalogList(), catalogDetail(), catalogJsonDialog()]
        });
    }
});
