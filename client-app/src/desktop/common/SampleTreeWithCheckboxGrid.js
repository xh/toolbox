/*
 * This file belongs to Hoist, an application development toolkit
 * developed by Extremely Heavy Industries (www.xh.io | info@xh.io)
 *
 * Copyright © 2018 Extremely Heavy Industries Inc.
 */
import {Component} from 'react';
import {elemFactory, HoistComponent, LayoutSupport, XH} from '@xh/hoist/core';
import {grid, GridModel} from '@xh/hoist/cmp/grid';
import {emptyFlexCol} from '@xh/hoist/cmp/grid/columns';
import {filler, fragment} from '@xh/hoist/cmp/layout';
import {LocalStore} from '@xh/hoist/data';
import {colChooserButton, exportButton, refreshButton} from '@xh/hoist/desktop/cmp/button';
import {checkbox, switchInput} from '@xh/hoist/desktop/cmp/form';
import {panel} from '@xh/hoist/desktop/cmp/panel';
import {storeCountLabel, storeFilterField} from '@xh/hoist/desktop/cmp/store';
import {toolbar, toolbarSep} from '@xh/hoist/desktop/cmp/toolbar';
import {numberRenderer} from '@xh/hoist/format';
import {PendingTaskModel} from '@xh/hoist/utils/async';
import './SampleTreeWithCheckboxGrid.scss';

@HoistComponent
@LayoutSupport
class SampleTreeWithCheckboxGrid extends Component {

    loadModel = new PendingTaskModel();

    localModel = new GridModel({
        treeMode: true,
        store: new LocalStore({
            fields: [
                'id', 'name', 'pnl',
                {name: 'enabled', type: 'bool', defaultValue: false}
            ]
        }),
        sortBy: 'name',
        emptyText: 'No records found...',
        enableColChooser: true,
        enableExport: true,
        columns: [
            {
                headerName: 'Name',
                width: 200,
                field: 'name',
                ...this.createCustomTreeColumn()
            },
            {
                headerName: 'P&L',
                field: 'pnl',
                align: 'right',
                width: 130,
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
        this.loadAsync();
    }

    render() {
        const {model} = this;

        return panel({
            item: grid({className: 'sample-tree-checkbox-grid', model}),
            mask: this.loadModel,
            bbar: toolbar(
                refreshButton({model: this}),
                toolbarSep(),
                switchInput({
                    model,
                    field: 'compact',
                    label: 'Compact',
                    labelAlign: 'left'
                }),
                filler(),
                storeCountLabel({gridModel: model, units: 'companies'}),
                storeFilterField({gridModel: model}),
                colChooserButton({gridModel: model}),
                exportButton({model, exportType: 'excel'})
            ),
            className: this.getClassName(),
            ...this.getLayoutProps()
        });
    }

    //------------------------
    // Implementation
    //------------------------
    loadAsync() {
        const {model, loadModel} = this;

        return XH.portfolioService
            .getPortfolioAsync(['fund', 'region'])
            .then(data => model.loadData(data))
            .linkTo(loadModel);
    }


    createCustomTreeColumn() {
        const me = this;
        return {
            isTreeColumn: true,
            agOptions: {
                cellRendererParams: {
                    suppressCount: true,
                    innerRendererFramework:
                        class extends Component {
                            constructor(props) {
                                super(props);
                                props.reactContainer.style = 'display: inherit';
                            }

                            render() {
                                const rec = this.props.data;
                                return fragment(
                                    checkbox({
                                        value: rec.enabled,
                                        onChange: () => me.toggleNode(rec)
                                    }),
                                    rec.name
                                );
                            }

                            refresh() {return false}
                        }
                }
            }
        };
    }

    toggleNode(rec) {
        const {store} = this.model,
            realRec = store.getById(rec.id);

        realRec.enabled = !realRec.enabled;
        this.setChildren(realRec, realRec.enabled);
        this.updateParents(realRec);
        store.noteDataUpdated();
    }

    setChildren(rec, enabled) {
        rec.children.forEach(it => {
            it.enabled = enabled;
            this.setChildren(it, enabled);
        });
    }

    updateParents(rec) {
        if (!rec.parent) return;

        const parent = rec.parent,
            isAllEnabled = (rec) => rec.children.every(it => it.enabled && isAllEnabled(it)),
            isAllDisabled = (rec) => rec.children.every(it => !it.enabled && isAllDisabled(it)),
            allEnabled = isAllEnabled(parent),
            allDisabled = isAllDisabled(parent);

        parent.enabled = allEnabled ? true : (allDisabled ? false : null);
        this.updateParents(parent);
    }
}
export const sampleTreeWithCheckboxGrid = elemFactory(SampleTreeWithCheckboxGrid);
