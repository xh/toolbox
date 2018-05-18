/*
 * This file belongs to Hoist, an application development toolkit
 * developed by Extremely Heavy Industries (www.xh.io | info@xh.io)
 *
 * Copyright © 2018 Extremely Heavy Industries Inc.
 */
import {Component} from 'react';
import {XH, HoistComponent} from 'hoist/core';
import {wrapperPanel} from '../impl/WrapperPanel';
import {vframe} from 'hoist/cmp/layout';
import {panel} from 'hoist/cmp/panel';
import {leftRightChooser, leftRightChooserFilter, LeftRightChooserModel} from 'hoist/cmp/leftrightchooser';
import {toolbar} from 'hoist/cmp/toolbar';
import data from './impl/LeftRightChooserData';

@HoistComponent()
export class LeftRightChooserPanel extends Component {

    leftRightChooserModel = new LeftRightChooserModel({
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
                        model: this.leftRightChooserModel
                    })
                )
            })
        );
    }

    renderExample() {
        return vframe({
            cls: 'xh-toolbox-example-container',
            item: leftRightChooser({model: this.leftRightChooserModel})
        });
    }

    destroy() {
        XH.safeDestroy(this.leftRightChooserModel);
    }

}