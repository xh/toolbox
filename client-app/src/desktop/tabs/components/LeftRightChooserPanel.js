/*
 * This file belongs to Hoist, an application development toolkit
 * developed by Extremely Heavy Industries (www.xh.io | info@xh.io)
 *
 * Copyright © 2018 Extremely Heavy Industries Inc.
 */
import {Component} from 'react';
import {XH, hoistComponent} from 'hoist/core';
import {wrapperPanel} from '../impl/WrapperPanel';
import {vframe} from 'hoist/layout';
import {leftRightChooser, leftRightChooserFilter, LeftRightChooserModel, panel, toolbar} from 'hoist/cmp';
import data from './impl/LeftRightChooserData';

@hoistComponent()
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
                bottomToolbar: toolbar(
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