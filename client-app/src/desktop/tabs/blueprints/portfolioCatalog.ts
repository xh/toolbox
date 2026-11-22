import {DataCatalog} from '@xh/hoist-chat-kit/blueprint';
import {XH} from '@xh/hoist/core';
import {pick} from 'lodash';
import {PORTFOLIO_TYPE} from '../../../blueprints/blueprintTypes';

let catalogPromise: Promise<DataCatalog> = null;

/** The server's Data Catalog narrowed to the portfolio datasets, loaded once for the tab's guide pages. */
export function portfolioCatalogAsync(): Promise<DataCatalog> {
    catalogPromise ??= XH.fetchJson({url: 'blueprints/catalog'})
        .then(
            json =>
                new DataCatalog({...json, datasets: pick(json.datasets, PORTFOLIO_TYPE.datasets)})
        )
        .catch(e => {
            catalogPromise = null;
            throw e;
        });
    return catalogPromise;
}
