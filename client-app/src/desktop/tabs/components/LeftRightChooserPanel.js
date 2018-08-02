/*
 * This file belongs to Hoist, an application development toolkit
 * developed by Extremely Heavy Industries (www.xh.io | info@xh.io)
 *
 * Copyright © 2018 Extremely Heavy Industries Inc.
 */
import {Component} from 'react';
import {HoistComponent} from '@xh/hoist/core';
import {wrapper} from '../impl/Wrapper';
import {panel} from '@xh/hoist/desktop/cmp/panel';
import {leftRightChooser, leftRightChooserFilter, LeftRightChooserModel} from '@xh/hoist/desktop/cmp/leftrightchooser';
import {toolbar} from '@xh/hoist/desktop/cmp/toolbar';
import {switchField} from '@xh/hoist/desktop/cmp/form';
import data from './impl/LeftRightChooserData';
import {observable, runInAction} from '@xh/hoist/mobx';

@HoistComponent()
export class LeftRightChooserPanel extends Component {

    localModel = new LeftRightChooserModel({
        data,
        ungroupedName: 'Others',
        rightGroupingEnabled: false
    });

    @observable anyMatch = false;

    render() {
        return wrapper({
            description: `
                LeftRightChooser splits a list of items into generic "left" and "right" sides,
                with controls for the user to move items between the two. This can be used to e.g.
                create a selected subset from a pool of items - see the grid column chooser for 
                such an example. Items can provide optional descriptions and groups, and can be 
                locked to prevent them from being moved.
            `,
            item: panel({
                title: 'Components > LeftRightChooser',
                width: 600,
                height: 400,
                item: leftRightChooser({
                    model: this.model,
                    flex: 1
                }),
                bbar: toolbar(
                    leftRightChooserFilter({
                        fields: ['text'],
                        model: this.model,
                        anyMatch: this.anyMatch
                    }),
                    switchField({
                        value: this.anyMatch,
                        onCommit: (val) => {
                            runInAction(() => this.anyMatch = val);
                        },
                        text: 'match anywhere in the string'
                    })
                )
            })
        });
    }

}