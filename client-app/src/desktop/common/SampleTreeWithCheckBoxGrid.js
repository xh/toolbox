/*
 * This file belongs to Hoist, an application development toolkit
 * developed by Extremely Heavy Industries (www.xh.io | info@xh.io)
 *
 * Copyright © 2018 Extremely Heavy Industries Inc.
 */
import {Component} from 'react';
import {elemFactory, HoistComponent, LayoutSupport} from '@xh/hoist/core';
import {wait} from '@xh/hoist/promise';
import {box, filler, fragment} from '@xh/hoist/cmp/layout';
import {grid, GridModel, colChooserButton} from '@xh/hoist/cmp/grid';
import {storeFilterField, storeCountLabel} from '@xh/hoist/desktop/cmp/store';
import {panel} from '@xh/hoist/desktop/cmp/panel';
import {exportButton, refreshButton} from '@xh/hoist/desktop/cmp/button';
import {checkBox, switchInput} from '@xh/hoist/desktop/cmp/form';
import {toolbarSep} from '@xh/hoist/desktop/cmp/toolbar';
import {toolbar} from '@xh/hoist/desktop/cmp/toolbar';
import {emptyFlexCol} from '@xh/hoist/columns';
import {LocalStore} from '@xh/hoist/data';
import {numberRenderer} from '@xh/hoist/format';
import {PendingTaskModel} from '@xh/hoist/utils/async';
import {mask} from '@xh/hoist/desktop/cmp/mask';

import {sampleTreeData} from '../../core/data';
import './SampleTreeWithCheckBoxGrid.scss';

@HoistComponent
@LayoutSupport
class SampleTreeWithCheckBoxGrid extends Component {

    loadModel = new PendingTaskModel();

    localModel = new GridModel({
        treeMode: true,
        store: new LocalStore({
            fields: ['id', 'name', 'pnl']
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
            className: this.getClassName(),
            ...this.getLayoutProps(),
            item: grid({className: 'sample-tree-checkbox-grid', model}),
            mask: mask({spinner: true, model: this.loadModel}),
            bbar: toolbar({
                omit: this.props.omitToolbar,
                items: [
                    storeFilterField({gridModel: model}),
                    storeCountLabel({
                        gridModel: model,
                        units: 'companies'
                    }),
                    filler(),
                    box('Compact mode:'),
                    switchInput({
                        field: 'compact',
                        model
                    }),
                    toolbarSep(),
                    colChooserButton({gridModel: model}),
                    exportButton({model, exportType: 'excel'}),
                    refreshButton({model: this})
                ]
            })
        });
    }

    //------------------------
    // Implementation
    //------------------------
    loadAsync() {
        wait(250)
            .then(() => this.model.loadData(sampleTreeData))
            .linkTo(this.loadModel);
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
                                    checkBox({
                                        checked: rec.enabled,
                                        indeterminate: rec.indeterminate,
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

        realRec.indeterminate = false;
        realRec.enabled = !realRec.enabled;
        this.setChildren(realRec, realRec.enabled);
        this.updateParents(realRec);
        store.noteDataUpdated();
    }

    setChildren(rec, enabled) {
        rec.children.forEach(it => {
            it.indeterminate = false;
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
            allDisabled = isAllDisabled(parent),
            indeterminate = !allEnabled && !allDisabled;

        parent.indeterminate = indeterminate;
        parent.enabled = allEnabled;

        this.updateParents(parent);
    }
}
export const sampleTreeWithCheckBoxGrid = elemFactory(SampleTreeWithCheckBoxGrid);
