/*
 * This file belongs to Hoist, an application development toolkit
 * developed by Extremely Heavy Industries (www.xh.io | info@xh.io)
 *
 * Copyright © 2018 Extremely Heavy Industries Inc.
 */
import React, {Component} from 'react';
import {HoistComponent} from '@xh/hoist/core';
import {wait} from '@xh/hoist/promise';
import {box, div, vframe} from '@xh/hoist/cmp/layout';
import {panel} from '@xh/hoist/desktop/cmp/panel';
import {toolbar, toolbarSep} from '@xh/hoist/desktop/cmp/toolbar';
import {button} from '@xh/hoist/desktop/cmp/button';
import {newSelect, switchInput} from '@xh/hoist/desktop/cmp/form';
import {upperFirst} from 'lodash';

import {usStates} from '../../../core/data';
import {wrapper} from '../../common';
import {SelectPanelModel} from './SelectPanelModel';
import './ControlsPanel.scss';

@HoistComponent
export class SelectPanel extends Component {

    localModel = new SelectPanelModel();

    render() {
        return wrapper({
            item: panel({
                className: 'toolbox-selects-panel',
                width: '90%',
                height: '90%',
                item: div({
                    style: {
                        flex: 1,
                        padding: 10,
                        overflowY: 'auto'
                    },

                    items: [
                        this.renderSelect({
                            title: 'Simple',
                            field: 'option1',
                            select: {
                                log: true,
                                options: usStates,
                                enableCreate: true,
                                width: 200
                            }
                        }),
                        this.renderSelect({
                            title: 'Async',
                            field: 'option3',
                            select: {
                                log: false,
                                loadingMessageFn: (q) => `Searching states for ${q}...`,
                                queryFn: this.queryStatesAsync
                            }
                        }),
                        this.renderSelect({
                            title: 'Multi',
                            field: 'option2',
                            select: {
                                options: usStates
                            }
                        })
                    ]
                })
            })
        });
    }

    renderSelect(opts) {
        const {model} = this,
            {field} = opts,
            setter = model[`set${upperFirst(field)}`];

        return panel({
            title: opts.title,
            margin: '0 0 10 0',
            item: vframe({
                items: [
                    newSelect({
                        model,
                        field,
                        emitObjects: model[field + 'Obj'],
                        enableMulti: model[field + 'Multi'],
                        enableCreate: model[field + 'Create'],
                        ...opts.select
                    }),
                    box({
                        item: <span>Value: <code>{`${JSON.stringify(model[field])}`}</code></span>,
                        margin: '10 0'
                    })
                ],
                padding: 10
            }),
            bbar: toolbar(
                button({text: 'CA', onClick: () => setter('CA')}),
                button({text: 'NY', onClick: () => setter('NY')}),
                button({text: 'XX', onClick: () => setter('XX')}),
                toolbarSep(),
                // button({text: '{CA}', onClick: () => setter({value: 'CA', label: 'California'})}),
                // button({text: '{XX}', onClick: () => setter({value: 'XX', label: 'XX State'})}),
                // toolbarSep(),
                // button({text: '[NY]', onClick: () => setter(['NY'])}),
                // button({text: '[CA,NY]', onClick: () => setter(['CA', 'NY'])}),
                // toolbarSep(),
                // button({text: '""', onClick: () => setter('')}),
                button({text: 'null', onClick: () => setter(null)}),
                toolbarSep(),
                switchInput({model, field: field + 'Obj', label: '{}'}),
                switchInput({model, field: field + 'Multi', label: '[]'}),
                switchInput({model, field: field + 'Create', label: '+'})
            )
        });
    }

    emitSwitch(field) {
        return switchInput({model: this.model, field: field + 'Obj', label: 'as objects'});
    }

    queryStatesAsync = (q) => {
        q = q ? q.toLowerCase() : null;
        return wait(1000).then(() => {
            return q ? usStates.filter(it => it.label.toLowerCase().startsWith(q)) : [];
        });
    };

    genMany() {
        const ret = [];
        usStates.forEach(it => {
            for (let i = 0; i < 10; i++) {
                ret.push({label: it.label + i, value: it.value + i});
            }
        });
        return ret;
    }

}
