/*
 * This file belongs to Hoist, an application development toolkit
 * developed by Extremely Heavy Industries (www.xh.io | info@xh.io)
 *
 * Copyright © 2018 Extremely Heavy Industries Inc.
 */
import {Component} from 'react';
import {HoistComponent, XH} from '@xh/hoist/core';
import {panel} from '@xh/hoist/desktop/cmp/panel';
import {wrapper} from '../../common';
import {toolbar} from '@xh/hoist/desktop/cmp/toolbar/index';
import {vspacer, hframe, box} from '@xh/hoist/cmp/layout/index';
import {button} from '@xh/hoist/desktop/cmp/button';
import {Icon} from '@xh/hoist/icon';
import {
    checkBox,
    textInput,
    radioInput,
    textArea,
    select,
    jsonInput
} from '@xh/hoist/desktop/cmp/form/index';
import {field, FieldSupport} from '@xh/hoist/field/index';
import {div, span} from '@xh/hoist/cmp/layout/index';
import {action, computed} from '@xh/hoist/mobx/index';





@FieldSupport
@HoistComponent
export class ExceptionsPanel extends Component {

    @field('Require Reload')
    requireReload;

    @field('Show Alert')
    showAlert;

    constructor() {
        super();
        this.initFields({
            requireReload: false,
            showAlert: true
        });
    }

    @computed
    get opts() {
        const {requireReload, showAlert} = this;
        return Object.assign(
            {},
            {requireReload},
            {showAlert}
        )
    }

    render() {
        return wrapper({
            item: panel({
                title: 'Exception Handling',
                height: 500,
                width: 500,
                item: hframe(
                    panel({
                        items: [
                            button({
                                text: 'Bad path',
                                onClick: this.onClick
                            })
                        ]
                    }),
                    toolbar({
                        vertical: true,
                        width: '30%',
                        items: [
                            span('Require Reload'),
                            checkBox({
                                field: 'requireReload',
                                model: this
                            }),
                            span('Show Alert'),
                            checkBox({
                                field: 'showAlert',
                                model: this
                            })
                        ]
                    })
                )
            })
        })
    }

    componentDidMount() {
        // this.allowLoad = true;
    }


    onClick = async () => {
        // if (!this.allowLoad) return;
        console.log(this.opts);
        return XH.fetchJson({
            url: 'badPath',
        }).catchDefault(this.opts);
    }

}