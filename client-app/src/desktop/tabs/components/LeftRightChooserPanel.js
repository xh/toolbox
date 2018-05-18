/*
 * This file belongs to Hoist, an application development toolkit
 * developed by Extremely Heavy Industries (www.xh.io | info@xh.io)
 *
 * Copyright © 2018 Extremely Heavy Industries Inc.
 */
import {Component} from 'react';
import {XH, HoistComponent} from 'hoist/core';
import {wrapperPanel} from '../impl/WrapperPanel';
import {panel, vframe} from 'hoist/cmp/layout';
import {leftRightChooser, leftRightChooserFilter, LeftRightChooserModel} from 'hoist/cmp/leftrightchooser';
import {toolbar} from 'hoist/cmp/toolbar';
import data from './impl/LeftRightChooserData';

@HoistComponent()
export class LeftRightChooserPanel extends Component {

    localModel = new LeftRightChooserModel({
        data,
        ungroupedName: 'Others',
        leftGroupingEnabled: false
    });

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
                        model: this.model
                    })
                )
            })
        );
    }

    renderExample() {
        return vframe({
            cls: 'xh-toolbox-example-container',
            item: leftRightChooser({model: this.model})
        });
    }

}