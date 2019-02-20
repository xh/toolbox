import {Component} from 'react';
import {HoistComponent, elemFactory} from '@xh/hoist/core';
import {div} from '@xh/hoist/cmp/layout';
import {page} from '@xh/hoist/mobile/cmp/page';
import {numberRenderer} from '@xh/hoist/format';
import {Icon} from '@xh/hoist/icon';

import {GridDetailPageModel} from './GridDetailPageModel';

@HoistComponent
export class GridDetailPage extends Component {

    constructor(props) {
        super(props);
        const {id} = props;
        this.model = new GridDetailPageModel({id});
    }

    render() {
        const {record} = this.model;

        return page({
            title: record.company,
            icon: Icon.fund(),
            className: 'toolbox-detail-page',
            items: [
                this.renderRow('ID', record.id),
                this.renderRow('Company', record.company),
                this.renderRow('City', record.city),
                this.renderRow('P&L', record.profit_loss, numberRenderer({precision: 0, ledger: true, colorSpec: true, asElement: true})),
                this.renderRow('Volume', record.trade_volume, numberRenderer({precision: 0, asElement: true}))
            ]
        });
    }

    renderRow(title, value, renderer) {
        return div({
            className: 'toolbox-detail-row',
            items: [
                div(title),
                div(renderer ? renderer(value) : value)
            ]
        });
    }
}

export const gridDetailPage = elemFactory(GridDetailPage);