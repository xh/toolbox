/*
 * This file belongs to Hoist, an application development toolkit
 * developed by Extremely Heavy Industries (www.xh.io | info@xh.io)
 *
 * Copyright © 2018 Extremely Heavy Industries Inc.
 */
import {Component} from 'react';
import {elemFactory, HoistComponent, LayoutSupport} from '@xh/hoist/core';
import {wait} from '@xh/hoist/promise';
import {grid, GridModel} from '@xh/hoist/desktop/cmp/grid';
import {panel} from '@xh/hoist/desktop/cmp/panel';
import {emptyFlexCol} from '@xh/hoist/columns';
import {LocalStore} from '@xh/hoist/data';
import {numberRenderer} from '@xh/hoist/format';

@HoistComponent
@LayoutSupport
class StrategyGrid extends Component {

    // loadModel = new PendingTaskModel();

    portfolioDataGenerator;

    localModel = new GridModel({
        treeMode: true,
        store: new LocalStore({
            fields: ['id', 'name', 'volume', 'pnl']
        }),
        sortBy: [{colId: 'name', sort: 'asc'}],
        emptyText: 'No records found...',
        enableColChooser: true,
        enableExport: true,
        columns: [
            {
                headerName: 'Name',
                width: 200,
                field: 'name',
                isTreeColumn: true
            },
            {
                headerName: 'Volume',
                field: 'volume',
                align: 'right',
                width: 130,
                absSort: true,
                agOptions: {
                    aggFunc: 'sum'
                },
                renderer: numberRenderer({
                    precision: 0,
                    ledger: true,
                    colorSpec: true,
                    tooltip: true
                })
            },
            {
                headerName: 'P&L',
                field: 'pnl',
                align: 'right',
                width: 130,
                absSort: true,
                agOptions: {
                    aggFunc: 'sum'
                },
                renderer: numberRenderer({
                    precision: 0,
                    ledger: true,
                    colorSpec: true,
                    tooltip: true
                })
            },
            {...emptyFlexCol}
        ]
    });

    constructor(props) {
        super(props);
        this.portfolioDataGenerator = props.children;
        this.loadAsync();

        this.addReaction({
            track: () => this.portfolioDataGenerator.portfolio,
            run: () => {
                console.log('  ... portfolio changed');
                this.model.loadData(this.portfolioDataGenerator.portfolio);
            }
        });
    }

    render() {
        const {model} = this;
        // , {store} = model;

        return panel({
            className: this.getClassName(),
            ...this.getLayoutProps(),
            item: grid({
                model,
                agOptions: {
                    onSelectionChanged: this.onSelectionChanged.bind(this)
                }
            }),
            mask: this.loadModel
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
    loadAsync() {
        wait(250)
            .then(() => this.model.loadData(this.portfolioDataGenerator.portfolio));
        // .linkTo(this.loadModel);
    }

    onSelectionChanged(event) {
        let record = event.api.getSelectedRows();
        console.log('onSelectionChanged', record[0].id);
        this.portfolioDataGenerator.selectOrders(record[0].id);
    }
}
export const strategyGrid = elemFactory(StrategyGrid);
