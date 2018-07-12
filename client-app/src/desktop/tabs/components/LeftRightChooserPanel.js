/*
 * This file belongs to Hoist, an application development toolkit
 * developed by Extremely Heavy Industries (www.xh.io | info@xh.io)
 *
 * Copyright © 2018 Extremely Heavy Industries Inc.
 */
import {Component} from 'react';
import {HoistComponent} from '@xh/hoist/core';
import {wrapperPanel} from '../impl/WrapperPanel';
import {vframe} from '@xh/hoist/cmp/layout';
import {panel} from '@xh/hoist/desktop/cmp/panel';
import {leftRightChooser, leftRightChooserFilter, LeftRightChooserModel} from '@xh/hoist/desktop/cmp/leftrightchooser';
import {toolbar} from '@xh/hoist/desktop/cmp/toolbar';
import {switchField} from '@xh/hoist/desktop/cmp/form';
import data from './impl/LeftRightChooserData';
import {setter, observable} from '@xh/hoist/mobx';

@HoistComponent()
export class LeftRightChooserPanel extends Component {

    localModel = new LeftRightChooserModel({
        data,
        ungroupedName: 'Others',
        leftGroupingEnabled: false
    });

    @setter @observable anyMatch = false;

    render() {
        return wrapperPanel(
            panel({
                cls: 'xh-toolbox-leftrightchooser-panel',
                title: 'LeftRightChooser Component',
                width: 600,
                height: 400,
                item: this.renderExample(),
                bbar: toolbar(
                    leftRightChooserFilter({
                        fields: ['text'],
                        model: this.model,
                        anyMatch: this.anyMatch
                    }),
                    switchField({
                        value: this.anyMatch,
                        onCommit: (val) => this.setAnyMatch(val),
                        text: 'AnyMatch filter'
                    })
                )
            })
        );
    }

    renderExample() {
        return vframe({
            cls: 'xh-toolbox-example-container',
            item: leftRightChooser({model: this.model, flex: 1})
        });
    }
}