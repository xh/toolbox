/*
 * This file belongs to Hoist, an application development toolkit
 * developed by Extremely Heavy Industries (www.xh.io | info@xh.io)
 *
 * Copyright © 2018 Extremely Heavy Industries Inc.
 */
import {Component} from 'react';
import {elemFactory, HoistComponent, LayoutSupport} from '@xh/hoist/core';
import {grid, GridModel} from '@xh/hoist/desktop/cmp/grid';
import {panel} from '@xh/hoist/desktop/cmp/panel';
import {LocalStore} from '@xh/hoist/data';

@HoistComponent
@LayoutSupport
class OrdersGrid extends Component {

    // loadModel = new PendingTaskModel();

    portfolioDataGenerator;

    localModel = new GridModel({
        treeMode: true,
        store: new LocalStore({
            fields: ['id', 'symbol', 'time', 'trader', 'dir', 'volume', 'pnl']
        }),
        sortBy: [{colId: 'time', sort: 'asc'}],
        emptyText: 'No records found...',
        enableColChooser: true,
        enableExport: true,
        columns: [
            {
                field: 'id',
                headerName: 'ID',
                hide: true
            },
            {
                field: 'symbol',
                headerName: 'Instrument',
                width: 200,
                tooltip: false
            },
            {
                field: 'time',
                headerName: 'Execution Time',
                width: 200,
                tooltip: false
            },
            {
                field: 'trader',
                headerName: 'Trader',
                width: 200,
                tooltip: false
            },
            {
                field: 'dir',
                headerName: 'Direction',
                width: 100,
                tooltip: false
            },
            {
                field: 'volume',
                headerName: 'Quantity',
                width: 190,
                tooltip: false
            },
            {
                field: 'pnl',
                headerName: 'PnL',
                width: 190,
                tooltip: false
            }
        ]
    });

    constructor(props) {
        super(props);
        this.portfolioDataGenerator = props.children;

        this.model.loadData(this.portfolioDataGenerator.selectedOrders);

        this.addReaction({
            track: () => this.portfolioDataGenerator.selectedOrders,
            run: () => {
                console.log('DATA CHANGED');
                this.model.loadData(this.portfolioDataGenerator.selectedOrders);
            }
        });
    }

    render() {
        const {model} = this;
        // , {store} = model;

        return panel({
            className: this.getClassName(),
            ...this.getLayoutProps(),
            item: grid({model})
            // mask: this.loadModel,
            // bbar: toolbar({
            //     omit: this.props.omitToolbar,
            //     items: [
            //         storeFilterField({
            //             store,
            //             fields: ['name']
            //         }),
            //         storeCountLabel({
            //             store,
            //             units: 'companies'
            //         }),
            //         filler(),
            //         box('Compact mode:'),
            //         switchInput({
            //             field: 'compact',
            //             model
            //         }),
            //         toolbarSep(),
            //         colChooserButton({gridModel: model}),
            //         exportButton({model, exportType: 'excel'}),
            //         refreshButton({model: this})
            //     ]
            // })
        });
    }

    //------------------------
    // Implementation
    //------------------------
    // loadAsync() {
    //     const posData = new portfolioDataGenerator();
    //     let test = posData.positionsSampleData;
    //     console.log(test);
    //     // this.model.loadData(posData.positionsSampleData);
    // }
}
export const ordersGrid = elemFactory(OrdersGrid);
